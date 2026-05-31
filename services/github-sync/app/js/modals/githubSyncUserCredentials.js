import { db, ObjectId } from '../mongodb.js'

function normalizeObjectId(value) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}

async function findOne(query = {}, options = {}) {
  return await db.githubSyncUserCredentials.findOne(query, options)
}

async function findByUserId(userId, options = {}) {
  return await findOne({ userId: normalizeObjectId(userId) }, options)
}

async function saveOrUpdateByUserId(userId, authTokenEncrypted) {
  await db.githubSyncUserCredentials.updateOne(
    { userId: normalizeObjectId(userId) },
    {
      $set: {
        auth_token_encrypted: authTokenEncrypted,
      },
      $setOnInsert: {
      },
    },
    { upsert: true }
  )

  return await findByUserId(userId)
}

async function updateByUserId(userId, update = {}) {
  await db.githubSyncUserCredentials.updateOne(
    { userId: normalizeObjectId(userId) },
    { $set: { ...update } }
  )
  return await findByUserId(userId)
}

async function removeByUserId(userId) {
  return await db.githubSyncUserCredentials.deleteMany({
    userId: normalizeObjectId(userId),
  })
}

export default {
  findOne,
  findByUserId,
  saveOrUpdateByUserId,
  updateByUserId,
  removeByUserId,
}
