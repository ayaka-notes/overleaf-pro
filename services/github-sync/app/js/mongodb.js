// @ts-check

import Metrics from '@overleaf/metrics'
import Settings from '@overleaf/settings'
import MongoUtils from '@overleaf/mongo-utils'
import { MongoClient } from 'mongodb'

export { ObjectId } from 'mongodb'

export const mongoClient = new MongoClient(
  Settings.mongo.url,
  Settings.mongo.options
)
const mongoDb = mongoClient.db()

export const db = {
  githubSyncEntityVersions: mongoDb.collection('githubSyncEntityVersions'),
  githubSyncProjectStates: mongoDb.collection('githubSyncProjectStates'),
  githubSyncUserCredentials: mongoDb.collection('githubSyncUserCredentials'),
}

Metrics.mongodb.monitor(mongoClient)

export async function cleanupTestDatabase() {
  await MongoUtils.cleanupTestDatabase(mongoClient)
}
