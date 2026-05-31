import logger from "@overleaf/logger";
import settings from "@overleaf/settings";
import ProjectEntityHandler from "../../../../app/src/Features/Project/ProjectEntityHandler.mjs";
import ProjectGetter from "../../../../app/src/Features/Project/ProjectGetter.mjs";
import Path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import FileTypeManager from "../../../../app/src/Features/Uploads/FileTypeManager.mjs";
import EditorController from "../../../../app/src/Features/Editor/EditorController.mjs";
import { fetchJson } from '@overleaf/fetch-utils'
import { promises as fsPromises } from 'fs'
import { Snapshot } from 'overleaf-editor-core'
import { pipeline } from 'stream/promises'
import { fetchStream } from '@overleaf/fetch-utils'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

const proxyUrl = process.env.GITHUB_SYNC_PROXY_URL
const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined


/**
 * Validate a file path
 */
function validateFilePath(path) {
  // Check for invalid characters or patterns
  // Git-bridge already handles most validation, but we do basic checks

  if (!path || path.length === 0) {
    return { valid: false, state: 'error' }
  }

  // Check for null bytes
  if (path.includes('\0')) {
    return { valid: false, state: 'error' }
  }

  // Check for suspicious patterns
  if (path.includes('..') || path.startsWith('/')) {
    return { valid: false, state: 'error' }
  }

  // Check for .git directory
  if (path.startsWith('.git/') || path === '.git') {
    return { valid: false, state: 'disallowed' }
  }

  return { valid: true }
}

async function postSnapshot(projectId, files, userId, token) {
  const source = 'github'
  const project = await ProjectGetter.promises.getProject(projectId, {
    name: 1,
    rootFolder: 1,
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const { docs, files: existingFiles } =
    await ProjectEntityHandler.promises.getAllEntities(projectId)

  logger.debug(
    { projectId, numFiles: files.length, userId },
    'Processing snapshot push'
  )

  const existingPaths = new Set()
  // docs is editable docs
  docs.forEach(doc => existingPaths.add(doc.path))
  // existingFiles is blob files
  existingFiles.forEach(file => existingPaths.add(file.path))

  // Track which paths are in the new snapshot
  const newPaths = new Set(files.map(f => "/" + f.name))

  // validate files first
  const invalidFiles = []
  for (const file of files) {
    const validation = validateFilePath(file.name)
    if (!validation.valid) {
      invalidFiles.push({
        file: file.name,
        state: validation.state,
        cleanFile: validation.cleanPath,
      })
    }
  }
  logger.debug(
    { invalidFiles }, 'File validation completed successfully'
  )

  if (invalidFiles.length > 0) {
    logger.warn(
      { projectId, invalidFiles }, 'Invalid file paths detected in snapshot'
    )
  }

  const fsPath = Path.join(
    settings.path.dumpFolder,
    `${projectId}_${crypto.randomUUID()}`
  )

  for (const file of files) {
    if (file.url) {
      // File has been modified - download and update it
      await downloadFile(file.url, fsPath, file.name, token)
    }
  }

  for (const file of files) {
    const filePath = file.name
    const elementPath = "/" + file.name
    const localPath = Path.join(fsPath, file.name)

    if (file.url) {
      const fileType = await determineFileType(projectId, filePath, localPath, docs, existingFiles)

      // File has been modified - update it
      if (fileType === 'doc') {
        const docLines = await readFileIntoTextArray(localPath)

        await EditorController.promises.upsertDocWithPath(
          projectId,
          elementPath,
          docLines,
          source,
          userId
        )
      } else {
        await EditorController.promises.upsertFileWithPath(
          projectId, elementPath, localPath, null, source, userId)
      }
    }
  }

  // Now handle deletions - any existing path not in newPaths should be deleted
  const pathsToDelete = [...existingPaths].filter(path => !newPaths.has(path))
  for (const path of pathsToDelete) {
    try {
      await EditorController.promises.deleteEntityWithPath(
        projectId,
        path,
        source,
        userId
      )
      logger.debug({ projectId, path, source }, 'Deleted file from project')
    } catch (err) {
      logger.warn({ err, projectId, path, source }, 'Failed to delete file')
    }
  }

  // Clean up temp files
  fs.rm(fsPath, { recursive: true, force: true }, (err) => {
    if (err) {
      logger.warn({ err, projectId, fsPath }, 'Failed to clean up temp files')
    } else {
      logger.debug({ projectId, fsPath }, 'Cleaned up temp files successfully')
    }
  })
}


/**
 * Read a file into an array of lines
 */
async function readFileIntoTextArray(fsPath) {
  let content = await fsPromises.readFile(fsPath, 'utf8')
  if (content === null || content === undefined) {
    content = ''
  }
  const lines = content.split(/\r\n|\n|\r/)
  return lines
}

/**
 * Determine if a file should be treated as a doc or binary file
 * - path: relateive path to project
 * - fsPath: the local file path we downloaded to
 */
async function determineFileType(projectId, path, fsPath, docs, files) {
  // Check if there is an existing file with the same path
  const existingDoc = docs.find(d => d.path === path)
  const existingFile = files.find(f => f.path === path)
  const existingFileType = existingDoc ? 'doc' : existingFile ? 'file' : null

  // Determine whether the update should create a doc or binary file
  const { binary, encoding } = await FileTypeManager.promises.getType(
    path,
    fsPath,
    existingFileType
  )

  // If we receive a non-utf8 encoding, treat as binary
  const isBinary = binary || encoding !== 'utf-8'

  // If a binary file already exists, always keep it as a binary file
  if (existingFileType === 'file') {
    return 'file'
  } else {
    return isBinary ? 'file' : 'doc'
  }
}

// fsPath: dumpFolder for our temp download
async function downloadFile(url, fsPath, fileName, token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3.raw'
  }

  const response = await fetch(url, { headers: headers, agent: httpsAgent })

  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`)
  }

  const filePath = Path.join(fsPath, fileName)
  await fs.promises.mkdir(Path.dirname(filePath), { recursive: true })
  const writeStream = fs.createWriteStream(filePath)

  try {
    const readStream = await fetchStream(url, { headers, agent: httpsAgent })
    await pipeline(readStream, writeStream)
    return fsPath
  } catch (err) {
    // Clean up on error
    try {
      await fsPromises.unlink(filePath)
    } catch (unlinkErr) {
      logger.warn({ err: unlinkErr, fsPath }, 'Failed to delete file after download error')
    }
    throw err
  }
}

export default {
  promises: {
    postSnapshot,
  }
}
