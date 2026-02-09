import _ from 'lodash'
import Path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expressify } from '@overleaf/promise-utils'
import logger from '@overleaf/logger'
import Metrics from '@overleaf/metrics'
import mongoose from 'mongoose'
import ProjectHelper from '../../../../app/src/Features/Project/ProjectHelper.mjs'
import { OError } from '../../../../app/src/Features/Errors/Errors.js'
import { Project } from '../../../../app/src/models/Project.mjs'
import { DeletedProject } from '../../../../app/src/models/DeletedProject.mjs'
import ProjectDeleter from '../../../../app/src/Features/Project/ProjectDeleter.mjs'

const __dirname = Path.dirname(fileURLToPath(import.meta.url))

async function manageProjectsPage(req, res, next) {
  const projectsBlobPending = _getProjects().catch(err => {
    logger.err({ err }, 'projects listing in background failed')
    return undefined
  })

  const prefetchedProjectsBlob = await projectsBlobPending

  Metrics.inc('project-list-prefetch-projects', 1, {
    status: prefetchedProjectsBlob ? 'success' : 'error',
  })

  res.render(Path.resolve(__dirname, '../views/manage-projects-react'), {
    title: 'Manage Projects',
    prefetchedProjectsBlob,
  })
}

async function getProjectsJson(req, res) {
  const { filters, page, sort } = req.body
  const { userId } = req.params

  const projectsPage = await _getProjects(userId, filters, sort, page)
  res.json(projectsPage)
}

async function _getProjects(
  userId = null,
  filters = {},
  sort = { by: 'lastUpdated', order: 'desc' },
  page = { size: 20 }
) {

  const projection = {
    _id: 1,
    name: 1,
    lastUpdated: 1,
    lastUpdatedBy: 1,
    lastOpened: 1,
    trashed: 1,
    owner_ref: 1,
  }

  const actualProjects = await Project.find(
    userId == null ? {} : { owner_ref: userId },
    projection,
  ).limit(1000).lean().exec()

  const delProjection = Object.fromEntries(
    Object.keys(projection).map(k => [`project.${k}`, 1])
  )
  delProjection['deleterData.deletedAt'] = 1
  delProjection['deleterData.deleterId'] = 1

  const deletedProjects = await DeletedProject.find(
    userId == null ? { project: { $type: 'object' } } : { 'project.owner_ref': userId },
    delProjection
  ).limit(1000).lean().exec()

  const formattedActualProjects = _formatProjects(actualProjects, _formatProjectInfo)
  const formattedDeletedProjects = _formatProjects(deletedProjects, _formatDeletedProjectInfo)
  const formattedProjects = [...formattedActualProjects, ...formattedDeletedProjects]
  const filteredProjects = _applyFilters(formattedProjects, filters)
  const projects = _sortAndPaginate(filteredProjects, sort, page)

  return {
    totalSize: filteredProjects.length,
    projects,
  }
}

async function _searchProjects(
  userId = null,
  search = '',
) {
  const projection = {
    _id: 1,
    name: 1,
    lastUpdated: 1,
    lastUpdatedBy: 1,
    lastOpened: 1,
    trashed: 1,
    owner_ref: 1,
  }
  const userIdObj = userId ? new mongoose.Types.ObjectId(userId) : null

  const activeProjects = await Project.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'owner_ref',
        foreignField: '_id',
        as: 'owner'
      }
    },
    { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $and: [
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: search, options: 'i' } } },
              { 'owner.email': { $regex: search, $options: 'i' } },
              { 'owner.first_name': { $regex: search, $options: 'i' } },
              { 'owner.last_name': { $regex: search, $options: 'i' } }
            ]
          },
          ...(userIdObj ? [{ owner_ref: userIdObj }] : [])
        ]
      }
    },
    { $project: projection },
    { $limit: 1000 },
  ]).exec()

  const delProjection = Object.fromEntries(
    Object.keys(projection).map(k => [`project.${k}`, 1])
  )
  delProjection['deleterData.deletedAt'] = 1
  delProjection['deleterData.deleterId'] = 1

  const deletedProjects = await DeletedProject.aggregate([
    { $match: { project: { $type: 'object' } } },
    {
      $lookup: {
        from: 'users',
        localField: 'project.owner_ref',
        foreignField: '_id',
        as: 'owner'
      }
    },
    { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $and: [
          {
            $or: [
              { 'project.name': { $regex: search, $options: 'i' } },
              { $expr: { $regexMatch: { input: { $toString: '$project._id' }, regex: search, options: 'i' } } },
              { 'owner.email': { $regex: search, $options: 'i' } },
              { 'owner.first_name': { $regex: search, $options: 'i' } },
              { 'owner.last_name': { $regex: search, $options: 'i' } }
            ],
          },
          ...(userIdObj ? [{ 'project.owner_ref': userIdObj }] : [{ project: { $type: 'object' } }])
        ]
      }
    },
    { $project: delProjection },
    { $limit: 1000 },
  ]).exec()

  const formattedActiveProjects = _formatProjects(activeProjects, _formatProjectInfo)
  const formattedDeletedProjects = _formatProjects(deletedProjects, _formatDeletedProjectInfo)
  const formattedProjects = [...formattedActiveProjects, ...formattedDeletedProjects]

  return {
    totalSize: formattedProjects.length,
    projects: formattedProjects,
  }
}

function _formatProjects(projects, formatProjectInfo) {
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const formattedProjects = []

  for (const project of projects) {
    formattedProjects.push(
      formatProjectInfo(project, yearAgo)
    )
  }
  return formattedProjects
}

function _applyFilters(projects,  filters) {
  if (!_hasActiveFilter(filters)) {
    return projects
  }
  return projects.filter(project => _matchesFilters(project, filters))
}

function _sortAndPaginate(projects, sort, page) {
  if (
    (sort.by && !['lastUpdated', 'title', 'deletedAt', 'owner'].includes(sort.by)) ||
    (sort.order && !['asc', 'desc'].includes(sort.order))
  ) {
    throw new OError('Invalid sorting criteria', { sort })
  }

// sorting by owner is not implemented, it is mot needed
  const sortedProjects =
    sort.by === 'title'
      ? [...projects].sort((a, b) =>
          (a.name ?? '\uffff').localeCompare(b.name ?? '\uffff')
        )
      : _.orderBy(
          projects,
          [sort.by || 'lastUpdated'],
          [sort.order || 'desc']
        )
  return sortedProjects
}

function _formatProjectInfo(project, maxDate) {
  const owner_ref = project.owner_ref
  const trashed = owner_ref ? ProjectHelper.isTrashed(project, owner_ref) : false

  return {
    id: project._id.toString(),
    name: project.name,
    owner: project.owner_ref,
    lastUpdated: project.lastUpdated?.toISOString(),
    lastUpdatedBy: project.lastUpdatedBy,
    inactive: project.lastOpened < maxDate, 
    trashed,
    deleted: false,
  }
}

function _formatDeletedProjectInfo(deletedProject, maxDate) {
  const project = deletedProject.project
  const owner_ref = project.owner_ref
  const trashed = owner_ref ? ProjectHelper.isTrashed(project, owner_ref) : false

  return {
    id: project._id.toString(),
    name: project.name,
    owner: owner_ref,
    lastUpdated: project.lastUpdated?.toISOString(),
    lastUpdatedBy: project.lastUpdatedBy,
    inactive: project.lastOpened < maxDate,
    trashed,
    deleted: true,
    deletedAt: deletedProject.deleterData?.deletedAt?.toISOString(),
    deletedBy: deletedProject.deleterData?.deleterId,
  }
}

function _matchesFilters(project, filters) {
  if (filters.owned && (project.trashed || project.deleted)) {
    return false
  }
  if (filters.trashed && (!project.trashed || project.deleted)) {
    return false
  }
  if (filters.deleted && !project.deleted) {
    return false
  }
  if (filters.inactive && (project.trashed || project.deleted || !project.inactive)) {
    return false
  }
  if (
    filters.search?.length &&
    project.name.toLowerCase().indexOf(filters.search.toLowerCase()) === -1
  ) {
    return false
  }
  return true
}

function _hasActiveFilter(filters) {
  return Boolean(
    filters.owned ||
      filters.inactive ||
      filters.trashed ||
      filters.deleted ||
      filters.search?.length
  )
}

async function trashProjectForUser(req, res) {
  const projectId = req.params.project_id
  const { userId } = req.body
  await ProjectDeleter.promises.trashProject(projectId, userId)
  res.sendStatus(200)
}

async function untrashProjectForUser(req, res) {
  const projectId = req.params.project_id
  const { userId } = req.body
  await ProjectDeleter.promises.untrashProject(projectId, userId)
  res.sendStatus(200)
}

async function undeleteProject(req, res) {
  const projectId = req.params.project_id
  const { userId } = req.body
  const undelededProject = await ProjectDeleter.promises.undeleteProject(projectId, { userId })
  await ProjectDeleter.promises.untrashProject(projectId, userId)

  return res.json({
    name: undelededProject.name,
  })
}

async function purgeDeletedProject(req, res) {
  const projectId = req.params.project_id
  await ProjectDeleter.promises.expireDeletedProject(projectId)
  res.sendStatus(200)
}

async function getProjectsJsonBySearch(req, res) {
  const { search } = req.body
  const { userId } = req.body
  const projects = await _searchProjects(userId, search)
  res.json(projects)
}

export default {
  manageProjectsPage: expressify(manageProjectsPage),
  getProjectsJson: expressify(getProjectsJson),
  getProjectsJsonBySearch: expressify(getProjectsJsonBySearch),
  undeleteProject: expressify(undeleteProject),
  purgeDeletedProject: expressify(purgeDeletedProject),
  trashProjectForUser: expressify(trashProjectForUser),
  untrashProjectForUser: expressify(untrashProjectForUser),
}
