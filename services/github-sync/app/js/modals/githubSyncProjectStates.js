import { db, ObjectId } from '../mongodb.js'

function normalizeObjectId(value) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}

async function findOne(query = {}, options = {}) {
  return await db.githubSyncProjectStates.findOne(query, options)
}

async function findByProjectId(projectId, options = {}) {
  return await findOne({ projectId: normalizeObjectId(projectId) }, options)
}

// no upsert, only update if existed, otherwise return null
async function updateByProjectId(projectId, update = {}) {
  await db.githubSyncProjectStates.updateOne(
    { projectId: normalizeObjectId(projectId) },
    { $set: { ...update } }
  )
  return await findByProjectId(projectId)
}

// with upsert true
async function saveByProjectId(projectId, update = {}) {
  await db.githubSyncProjectStates.updateOne(
    { projectId: normalizeObjectId(projectId) },
    { $set: { ...update } },
    { upsert: true }
  )
  return await findByProjectId(projectId)
}

async function removeByProjectId(projectId) {
  return await db.githubSyncProjectStates.deleteOne({
    projectId: normalizeObjectId(projectId),
  })
}

export default {
  findOne,
  findByProjectId,
  updateByProjectId,
  saveByProjectId,
}
