import LearnRouter from './app/src/LearnRouter.mjs'
import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
import scrape from '../../scripts/learn/checkSanitize/scrape.mjs'
const { getAllPagesAndCache } = scrape
/** @import { WebModule } from "../../types/web-module" */

/** @type {WebModule} */
let LearnModule = {}

if (process.env.OVERLEAF_PROXY_LEARN === 'true') {
    logger.debug({}, 'Learn proxy enabled via OVERLEAF_PROXY_LEARN=true')

    // Get all page cache while starting up
    // Then no need to write script for pull all pages cache
    // Only ensure the pages are there, not latest content, we will update later.
    const BASE_URL = Settings.apis.wiki.url
    getAllPagesAndCache(BASE_URL).catch((err) => {
        logger.error({ err: err }, 'error caching learn pages on startup')
    })

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