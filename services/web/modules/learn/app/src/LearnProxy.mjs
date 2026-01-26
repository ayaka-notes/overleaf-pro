import sanitizeHtml from 'sanitize-html'
import Settings from '@overleaf/settings'
import { sanitizeOptions } from './sanitizeOptions.mjs'
import fs from 'node:fs'
import logger from '@overleaf/logger'
import Path from 'node:path'
import { expressify } from '@overleaf/promise-utils'
import scrape from '../../../../scripts/learn/checkSanitize/scrape.mjs'
const { scrapeAndCachePage } = scrape


// Check if the filePath are older than maxCacheAge
// Based on Settings.apis.wiki.maxCacheAgeer
// If older, re-fetch and update the cache
async function checkFileCache(learnPagesFolder, pageName) {
  const path = Path.join(learnPagesFolder, encodeURIComponent(pageName) + '.json')
  // Check if file exists
  let stat = null
  let now = Date.now()
  let mtime = 0
  try {
    stat = await fs.promises.stat(path)
    mtime = stat.mtime.getTime()
  } catch (e) {
    logger.error({ err: e }, `error stating cached page file: ${path}`)
  }


  // If the cache is older than maxCacheAge, refresh it
  if (stat === null || now - mtime > Settings.apis.wiki.maxCacheAge) {
    logger.debug({
      now: now,
      mtime: mtime,
      maxCacheAge: Settings.apis.wiki.maxCacheAge
    }, `out of date cache detected for file: ${path}`)

    const BASE_URL = Settings.apis.wiki.url

    try {
      await fs.promises.unlink(path)
      logger.debug({}, `deleted cached page file to force re-fetching: ${path}`)
    } catch (e) {
      logger.error({ err: e }, `error deleting cached page file: ${path}`)
    }
    await scrapeAndCachePage(BASE_URL, pageName)
  }

}

async function learnPage(req, res) {
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
  learnPath = encodeURIComponent(decodeURIComponent(learnPath.replace(/_/g, ' ')))
  logger.debug({}, `Learn proxy requested path: ${learnPath}`)

  // Contents.json Should be sidebarHtml
  let contentsFilePath = Path.resolve(Settings.path.learnPagesFolder, `Contents.json`)

  // If Contents.json does not exist, return 500
  if (!fs.existsSync(contentsFilePath)) {
    await checkFileCache(Settings.path.learnPagesFolder, 'Contents')
    return
  }

  await checkFileCache(Settings.path.learnPagesFolder, 'Contents')
  const raw = await fs.promises.readFile(contentsFilePath, 'utf-8')
  const json = JSON.parse(raw)
  const sidebarHtml = json.text['*']

  let pageFilePath = Path.resolve(Settings.path.learnPagesFolder, `${learnPath}.json`)
  // If the page does not exist, fallback to "Learn LaTeX in 30 minutes"
  if (!fs.existsSync(pageFilePath)) {
    learnPath = 'Learn%20LaTeX%20in%2030%20minutes'
    pageFilePath = Path.resolve(Settings.path.learnPagesFolder, `${learnPath}.json`)
  }

  await checkFileCache(Settings.path.learnPagesFolder, decodeURIComponent(learnPath))  
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
