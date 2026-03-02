import express from 'express'
import GitHubSyncController from './GitHubSyncController.js'
import { projectConcurrencyMiddleware } from './GitHubSyncMiddleware.js'

export function createServer() {
  const app = express()
  app.use(express.json())
  
  app.get('/status', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'github-sync' })
  })

  app.get('/healthz', (_req, res) => {
    res.sendStatus(204)
  })

  // Export a existing project to GitHub
  app.post('/project/:Project_id/user/:user_id/export',
    projectConcurrencyMiddleware,
    GitHubSyncController.exportProjectToGithub,
  )

  app.post('/project/:Project_id/user/:user_id/merge',
    projectConcurrencyMiddleware,
    GitHubSyncController.mergeToGitHubAndPushback,
  )

  return { app, server: app }
}