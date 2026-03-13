import { db, ObjectId } from '../mongodb.js'

const ENTITY_VERSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

function normalizeObjectId(value) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}

function defaultExpiresAt() {
  return new Date(Date.now() + ENTITY_VERSION_TTL_MS)
}

async function findOne(query = {}, options = {}) {
  return await db.githubSyncEntityVersions.findOne(query, options)
}

async function findByProjectIdAndEntityId(projectId, entityId, options = {}) {
  return await findOne(
    {
      pid: normalizeObjectId(projectId),
      eid: normalizeObjectId(entityId),
    },
    options
  )
}

async function saveOrUpdate(projectId, entityId, version, expiresAt) {
  const now = new Date()
  await db.githubSyncEntityVersions.updateOne(
    {
      pid: normalizeObjectId(projectId),
      eid: normalizeObjectId(entityId),
    },
    {
      $set: {
        pid: normalizeObjectId(projectId),
        eid: normalizeObjectId(entityId),
        v: version,
        c: expiresAt || defaultExpiresAt(),
        updated_at: now,
      },
      $setOnInsert: {
        created_at: now,
      },
    },
    { upsert: true }
  )

  return await findByProjectIdAndEntityId(projectId, entityId)
}

async function updateByProjectIdAndEntityId(projectId, entityId, update = {}) {
  const now = new Date()
  const nextUpdate = { ...update, updated_at: now }
  if (!Object.hasOwn(nextUpdate, 'c')) {
    nextUpdate.c = defaultExpiresAt()
  }

  await db.githubSyncEntityVersions.updateOne(
    {
      pid: normalizeObjectId(projectId),
      eid: normalizeObjectId(entityId),
    },
    { $set: nextUpdate }
  )

  return await findByProjectIdAndEntityId(projectId, entityId)
}

async function removeByProjectIdAndEntityId(projectId, entityId) {
  return await db.githubSyncEntityVersions.deleteOne({
    pid: normalizeObjectId(projectId),
    eid: normalizeObjectId(entityId),
  })
}

export default {
  findOne,
  findByProjectIdAndEntityId,
  saveOrUpdate,
  updateByProjectIdAndEntityId,
  removeByProjectIdAndEntityId,
}
