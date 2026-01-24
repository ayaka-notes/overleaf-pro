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
  // Set default image root if not provided
  let imageRootPath = process.env.IMAGE_ROOT || "ghcr.io/ayaka-notes";
  // Export imageRoot to Settings
  Settings.imageRoot = imageRootPath

  // allowedImageNames should be:
  // [
  //  { imageName: "texlive-2023:latest", imageDesc: "TeX Live 2023" },
  //  { imageName: "texlive-2022:latest", imageDesc: "TeX Live 2022" },
  // ]
  Settings.allowedImageNames = parseTextExtensions(process.env.ALL_TEX_LIVE_DOCKER_IMAGES)
    .map((texImage, index) => ({
      imageName: texImage.split("/")[texImage.split("/").length - 1],
      imageDesc: parseTextExtensions(process.env.ALL_TEX_LIVE_DOCKER_IMAGE_NAMES)[index]
        || texImage.split(':')[1],
    }))
  
  // In the end, imageName will be put together with imageRoot to form the full image path
  // The full name will be like: ghcr.io/ayaka-notes/texlive-2023:latest

  // Set default image name if not provided
  if(!process.env.TEX_LIVE_DOCKER_IMAGE) {
    process.env.TEX_LIVE_DOCKER_IMAGE = imageRootPath + "/" + Settings.allowedImageNames[0].imageName
  }

  // Export currentImageName to Settings
  // This is the new created projects' image name
  Settings.currentImageName = process.env.TEX_LIVE_DOCKER_IMAGE
}

/** @type {WebModule} */
const sandboxedCompilesModule = {}
export default sandboxedCompilesModule