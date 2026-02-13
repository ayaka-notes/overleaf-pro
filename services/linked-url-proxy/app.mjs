import '@overleaf/metrics/initialize.js'

import express from 'express'
import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
import Metrics from '@overleaf/metrics'
import LinkedUrlProxyController from './app/js/LinkedUrlProxyController.mjs'

Metrics.open_sockets.monitor(true)
Metrics.memory.monitor(logger)
Metrics.leaked_sockets.monitor(logger)

const app = express()

Metrics.injectMetricsRoute(app)
app.use(Metrics.http.monitor(logger))

app.get('/', LinkedUrlProxyController.proxy)
app.get('/status', (req, res) => res.send({ status: 'linked-url-proxy is up' }))

const host = Settings.internal.linkedUrlProxy.host
const port = Settings.internal.linkedUrlProxy.port

logger.debug('Listening at', { host, port })

const server = app.listen(port, host, function (error) {
  if (error) {
    throw error
  }
  logger.info({ host, port }, 'linked-url-proxy HTTP server starting up')
})

process.on('SIGTERM', () => {
  server.close(() => {
    logger.info({ host, port }, 'linked-url-proxy HTTP server closed')
    metrics.close()
  })
})

