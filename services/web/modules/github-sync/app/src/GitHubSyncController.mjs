import { expressify } from '@overleaf/promise-utils'
import SessionManager from '../../../../app/src/Features/Authentication/SessionManager.mjs'
import Csrf from '../../../../app/src/infrastructure/Csrf.mjs'
import GitHubSyncHandler from './GitHubSyncHandler.mjs'
import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
import Path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import ProjectUploadManager from '../../../../app/src/Features/Uploads/ProjectUploadManager.mjs'
import ProjectGetter from '../../../../app/src/Features/Project/ProjectGetter.mjs'
import { fetchJson } from '@overleaf/fetch-utils'
import UserGetter from '../../../../app/src/Features/User/UserGetter.mjs'


/**
 * Get user's GitHub connection status
 */
async function getStatus(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)

  const status = await GitHubSyncHandler.promises.getUserGitHubStatus(userId)
  if (!status) {
    return res.json({ enabled: false })
  }
  res.json(status)
}

/**
 * List user's GitHub repositories
 */
async function listRepos(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)

  try {
    const repos = await GitHubSyncHandler.promises.listUserRepos(userId)
    res.json({ repos })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}




/**
 * Get project's GitHub sync status
 */
async function getProjectStatus(req, res) {
  const { Project_id: projectId } = req.params

  const status = await GitHubSyncHandler.promises.getProjectGitHubSyncStatus(projectId)
  
  if (status && status.enabled) {
    const ownerId = status.ownerId
    const owner = await UserGetter.promises.getUser(ownerId, {
      _id: 1,
      email: 1,
    })
    if (owner) {
      status.owner = owner
    }

    // check if owner's GitHub credentials are still valid. If not, return enabled: false to trigger re-auth flow in frontend
    const credentials = await GitHubSyncHandler.promises.getGitHubAccessTokenForUser(ownerId)
    if (!credentials) {
      status.enabled = false
      return res.json({
        enabled: false
      }
      )
    }

    // remove status. last_sync_sha and .last_sync_version
    if (status.last_sync_sha)
      delete status.last_sync_sha
    if (status.last_sync_version)
      delete status.last_sync_version
  }
  res.json(status)
}




/**
 * Import a GitHub repository as a new project
 */
async function importRepo(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)
  const { projectName, repo } = req.body

  try {
    // Get the latest sha1, branch name of a repo
    const { defaultBranch, latestCommitSha } = await GitHubSyncHandler.promises.getRepoInfo(userId, repo)

    // Then download the zipball from GitHub and create a new project with that zipball
    const response = await GitHubSyncHandler.promises.getRepoZipball(userId, repo, latestCommitSha)

    const fsPath = Path.join(
      Settings.path.dumpFolder,
      `github_import_${crypto.randomUUID()}`
    )

    const ab = await response.arrayBuffer()
    fs.writeFileSync(fsPath, Buffer.from(ab))

    // Upload zip to create a new project
    const { project } = await ProjectUploadManager.promises.createProjectFromZipArchiveWithName(
      userId,
      projectName,
      fsPath,
      {}
    )
    const projectId = project._id.toString()

    // Clean up temp file
    fs.unlinkSync(fsPath)

    // Re get projectID and version
    // We need get from project history, because that's more accurate.
    const snapshot = await fetchJson(
      `${Settings.apis.project_history.url}/project/${projectId}/version`
    )
    const projectVersion = snapshot.version
    await GitHubSyncHandler.promises.saveNewlySyncedProjectState(
      project._id, 
      userId, 
      repo, 
      latestCommitSha, 
      defaultBranch, 
      projectVersion
    )

    res.json({ projectId: project._id})
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error importing GitHub repository')
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}



/**
 * Redirect user to GitHub OAuth authorization URL 
 *   to begin linking process
 */
async function beginAuth(req, res) {
  // build GitHub OAuth URL with required query parameters
  let authUrl = new URL('https://github.com/login/oauth/authorize')
  authUrl.searchParams.append('client_id', Settings.githubSync.clientID)
  authUrl.searchParams.append('redirect_uri', Settings.githubSync.callbackURL)
  authUrl.searchParams.append('scope', 'read:org,repo,workflow')
  let state = req.csrfToken()
  authUrl.searchParams.append('state', state)

  res.redirect(authUrl.toString())
}


/**
 * Handle GitHub OAuth callback and complete registration
 * 1. Validate CSRF token
 * 2. Exchange code for access token
 * 3. Save access token for user
 * 4. Redirect to user settings with success message
 */
async function completeRegistration(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)
  const { code, state } = req.query
  try {
    await Csrf.promises.validateToken(state, req.session)
  } catch (error) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }

  // fetch access token from GitHub using the code
  let data
  try {
    data = await GitHubSyncHandler.promises.exchangeCodeForToken(code)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!data.access_token) {
    return res.status(400).json({ error: 'Failed to obtain access token from GitHub' })
  }

  await GitHubSyncHandler.promises.saveGitHubAccessTokenForUser(userId, data.access_token)
  
  // Save success message in session to display on redirect
  req.session.projectSyncSuccessMessage = req.i18n.translate('github_successfully_linked_description')
  // redirect to /user/settings
  res.redirect('/user/settings?oauth-complete=github#project-sync')
}


/**
 * Disconnect user's GitHub account
 */
async function unlink(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)
  await GitHubSyncHandler.promises.removeGitHubAccessTokenForUser(userId)
  res.json({ success: true })
}

/**
 * Export changes to Github.
 * This will create a new repository on GitHub, and link the project to that repository.
 * Since this operation is invoked by loggenin user, we will use this to sync.
 */
async function exportProject(req, res){
  const userId = SessionManager.getLoggedInUserId(req.session)
  const { Project_id: projectId } = req.params
  const { name, description, private: isPrivate, org } = req.body

  logger.debug({ userId, projectId, name, isPrivate, org }, 'Received request to export project to GitHub')
  if (!name || isPrivate === undefined || !projectId) {
    return res.status(400).json({ error: 'Name, private and projectId are required' })
  }


  try {
    const repoResult = await GitHubSyncHandler.promises.exportProjectToGitHub(
      userId,
      projectId,
      name,
      description,
      isPrivate,
      org
    )
    res.json(repoResult)
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error exporting project to GitHub')
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

/**
 * Get unmerged commits from GitHub and show in Overleaf, 
 * so user can choose to merge or not.
 * Since this operation is invoked by any editor of the project, we will
 * use githubSyncStatus's owner to get
 */
async function getUnmergedCommits(req, res){
  const { Project_id: projectId } = req.params
  const projectStatus = await GitHubSyncHandler.promises.getProjectGitHubSyncStatus(projectId)

  if (!projectStatus?.enabled) {
    return res.status(400).json({ error: 'Project is not linked to a GitHub repository' })
  }

  const ownerId = projectStatus.ownerId
  const lastSyncSha = projectStatus.last_sync_sha
  const repo = projectStatus.repo
  const defaultBranch = projectStatus.default_branch

  if (!ownerId || !repo || !defaultBranch) {
    return res.status(400).json({ error: 'Project GitHub sync state is invalid' })
  }
  const credentials = await GitHubSyncHandler.promises.getGitHubAccessTokenForUser(ownerId)
  if (!credentials) {
    return res.status(400).json({ error: 'GitHub credentials not found for project owner' })
  }

  try {
    logger.debug({ lastSyncSha }, 'Getting commits since last sync')
    let commits = await GitHubSyncHandler.promises.listCommitsSince(
      ownerId, repo, defaultBranch, lastSyncSha
    )
    res.json({ 
      diverged: projectStatus.merge_status === 'failure',
      commits:  commits
    })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error listing commits since last sync')
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function mergeFromGitHub(req, res){
  const projectId = req.params.Project_id
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' })
  }

  let message = 'Merge changes from overleaf'
  if (req.body && req.body.message) {
    message = req.body.message
  }

  const projectStatus = await GitHubSyncHandler.promises.getProjectGitHubSyncStatus(projectId)
  if (!projectStatus?.enabled) {
    return res.status(400).json({ error: 'Project is not linked to a GitHub repository' })
  }
  const { ownerId, repo, default_branch: defaultBranch } = projectStatus
  if (!ownerId || !repo || !defaultBranch) {
    return res.status(400).json({ error: 'Project GitHub sync state is invalid' })
  }

  try {
    const result = await GitHubSyncHandler.promises.syncProjectToGitHub(
      ownerId, projectId, message
    )
    logger.debug({ projectId, result }, 'Merge from GitHub result')

    if (result.newSha && result.files) {
      const credentials = await GitHubSyncHandler.promises.getGitHubAccessTokenForUser(ownerId)
      if (!credentials) {
        throw new Error('GitHub credentials not found for project owner')
      }

      await GitHubSyncHandler.promises.applyChangesToOverleaf(
        projectId, result.newSha, result.files, ownerId)
    }
    
    res.status(200).json({ success: true })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error syncing project to GitHub')
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

// List user and user's orgs.
async function listOrgs(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)
  const result = await GitHubSyncHandler.promises.getGitHubOrgsForUser(userId)
  res.json(result)
}

export default {
  getStatus: expressify(getStatus),
  beginAuth: expressify(beginAuth),
  unlink: expressify(unlink),
  listOrgs: expressify(listOrgs),
  completeRegistration: expressify(completeRegistration),
  listRepos: expressify(listRepos),
  getProjectStatus: expressify(getProjectStatus),
  importRepo: expressify(importRepo),
  exportProject: expressify(exportProject),
  getUnmergedCommits: expressify(getUnmergedCommits),
  mergeFromGitHub: expressify(mergeFromGitHub),
}