import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
/** @import { WebModule } from "../../types/web-module" */

logger.debug({}, 'Enable Sandboxed Compiles')

const parseTextExtensions = function (extensions) {
  if (extensions) {
    return extensions.split(',').map(ext => ext.trim())
  } else {
    return []
  }
}

if (process.env.SANDBOXED_COMPILES === 'true') {
  Settings.allowedImageNames = parseTextExtensions(process.env.ALL_TEX_LIVE_DOCKER_IMAGES)
    .map((imageName, index) => ({
      imageName,
      imageDesc: parseTextExtensions(process.env.ALL_TEX_LIVE_DOCKER_IMAGE_NAMES)[index]
        || imageName.split(':')[1],
    }))
  if(!process.env.TEX_LIVE_DOCKER_IMAGE) {
    process.env.TEX_LIVE_DOCKER_IMAGE = Settings.allowedImageNames[0].imageName
  }
  Settings.currentImageName = process.env.TEX_LIVE_DOCKER_IMAGE
}

/** @type {WebModule} */
const sandboxedCompilesModule = {}
export default sandboxedCompilesModule