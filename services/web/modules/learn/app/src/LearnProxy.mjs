import sanitizeHtml from 'sanitize-html'
import Settings from '@overleaf/settings'
import { sanitizeOptions } from './sanitizeOptions.mjs'
import fs from 'node:fs'
import logger from '@overleaf/logger'
import Path from 'node:path'
import { expressify } from '@overleaf/promise-utils'

async function learnPage(req, res) {
  logger.debug({}, 'Learn proxy requested '+ req.path)
  let reqPath = req.path
  // Trim leading '/', only show the path after '/'
  if (reqPath.startsWith('/')) {
    reqPath = reqPath.slice(1)
  } else {
    res.status(400).send('Bad Request')
    return
  }
  let learnPath = reqPath

  if (learnPath === '') {
    logger.debug({}, 'Learn proxy requested root path, redirecting to Main/Page')
    learnPath = 'Main Page'
  }

  // Encode the path for file system usage
  learnPath = encodeURIComponent(learnPath.replace(/_/g, ' '))
  logger.debug({}, `Learn proxy requested path: ${learnPath}`)

  // Contents.json Should be sidebarHtml
  const contentsFilePath = Path.resolve(Settings.path.learnPagesDir, `Contents.json`)
  // If Contents.json does not exist, return 500
  if (!fs.existsSync(contentsFilePath)) {
    logger.error({}, `Learn proxy Contents.json not found at path: ${contentsFilePath}`)
    res.status(500).send('Internal Server Error')
    return
  }
  const raw = await fs.promises.readFile(contentsFilePath, 'utf-8')
  const json = JSON.parse(raw)
  const sidebarHtml = json.text['*']


  let pageFilePath = Path.resolve("/overleaf/services/web/data/learnPages/", `${learnPath}.json`)
  // If the page does not exist, fallback to "Learn LaTeX in 30 minutes"
  if (!fs.existsSync(pageFilePath)) {
    learnPath = 'Learn%20LaTeX%20in%2030%20minutes'
    pageFilePath = Path.resolve("/overleaf/services/web/data/learnPages/", `${learnPath}.json`)
  }

  const pageRaw = await fs.promises.readFile(pageFilePath, 'utf-8')
  const pageJson = JSON.parse(pageRaw)
  const pageTitle = pageJson.title
  const pageHtml = pageJson.text['*']


  res.render(Path.resolve(import.meta.dirname, '../views/learn'), {
    sidebarHtml: sanitizeHtml(sidebarHtml, sanitizeOptions),
    pageTitle: pageTitle,
    pageHtml: sanitizeHtml(pageHtml, sanitizeOptions),
  })
}

const LearnProxyController = {
  learnPage: expressify(learnPage),
}

export default LearnProxyController
