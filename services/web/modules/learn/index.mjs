import LearnRouter from './app/src/LearnRouter.mjs'
import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
/** @import { WebModule } from "../../types/web-module" */

/** @type {WebModule} */
let LearnModule = {}

if (process.env.OVERLEAF_PROXY_LEARN === 'true') {
    logger.debug({}, 'Learn proxy enabled via OVERLEAF_PROXY_LEARN=true')
    // Set learnPagesDir
    Settings.proxyLearn = true
    // Add header_extras with Documentation link
    Settings.nav.header_extras.push({text: "Documentation", url: "/learn", class: "nav-link"})

    // Export LearnModule
    LearnModule = {
        router: LearnRouter,
    }
}

export default LearnModule