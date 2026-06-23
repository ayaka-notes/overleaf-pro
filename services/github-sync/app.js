// Metrics must be initialized before importing anything else
import '@overleaf/metrics/initialize.js'
import logger from '@overleaf/logger'
import Settings from '@overleaf/settings'
import { createServer } from './app/js/server.js'
import { mongoClient } from './app/js/mongodb.js'

const port = Settings.internal?.githubSync?.port
const host = Settings.internal?.githubSync?.host
mongoClient
  .connect()
  .then(() => {
    logger.debug('Connected to MongoDB from GitHub Sync service')
  })
  .catch(err => {
    logger.fatal({ err }, 'Cannot connect to mongo. Exiting.')
    process.exit(1)
  })

const { server } = createServer()
server.listen(port, host, err => {
  if (err) {
    logger.fatal({ err }, `Cannot bind to ${host}:${port}. Exiting.`)
    process.exit(1)
  }

  logger.info({ host, port }, 'GitHub Sync service listening')
})