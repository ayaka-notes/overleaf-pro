const http = require('node:http')
const https = require('node:https')

http.globalAgent.maxSockets = 300
http.globalAgent.keepAlive = false
https.globalAgent.keepAlive = false

module.exports = {
  internal: {
    githubSync: {
      host: process.env.LISTEN_ADDRESS || '127.0.0.1',
      port: 3022,
    },
  },

  mongo: {
    url:
      process.env.MONGO_CONNECTION_STRING ||
      `mongodb://${process.env.MONGO_HOST || '127.0.0.1'}/sharelatex`,
    options: {
      monitorCommands: true,
    },
  },

  apis: {
    project_history: {
      url: `http://${process.env.PROJECT_HISTORY_HOST || '127.0.0.1'}:3054`,
    }
  }
}