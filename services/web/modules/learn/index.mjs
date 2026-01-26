import LearnRouter from './app/src/LearnRouter.mjs'
import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
import scrape from './app/src/scrape.mjs'
const { getAllPagesAndCache, scrapeAndCachePage } = scrape
/** @import { WebModule } from "../../types/web-module" */

/** @type {WebModule} */
let LearnModule = {}

if (process.env.OVERLEAF_PROXY_LEARN === 'true') {
    logger.info('Learn Proxy is enabled, please wait while we cache all pages...')

    // Get all page cache while starting up
    // Then no need to write script for pull all pages cache
    // Only ensure the pages are there, not latest content, we will update later.
    const BASE_URL = Settings.apis.wiki.url
    const pages = await getAllPagesAndCache(BASE_URL)
    for (const page of pages) {
        await scrapeAndCachePage(BASE_URL, page)
    }
    
    // Set learnPagesFolder
    Settings.proxyLearn = true
    // Add header_extras with Documentation link
    Settings.nav.header_extras.push({text: "Documentation", url: "/learn", class: "nav-link"})

    // Export LearnModule
    LearnModule = {
        router: LearnRouter,
    }
}

export default LearnModule