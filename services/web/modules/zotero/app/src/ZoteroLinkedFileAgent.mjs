import logger from '@overleaf/logger'
import { callbackify } from '@overleaf/promise-utils'
import LinkedFilesHandler from '../../../../app/src/Features/LinkedFiles/LinkedFilesHandler.mjs'
import ZoteroApiClient from './ZoteroApiClient.mjs'
import {
  ZoteroForbiddenError,
  ZoteroAccountNotLinkedError,
} from './ZoteroApiClient.mjs'
import LinkedFilesErrors from '../../../../app/src/Features/LinkedFiles/LinkedFilesErrors.mjs'
import { Project } from '../../../../app/src/models/Project.mjs'

const { AccessDeniedError, RemoteServiceError, NotOriginalImporterError } =
  LinkedFilesErrors

async function createLinkedFile(
  projectId,
  linkedFileData,
  name,
  parentFolderId,
  userId
) {
  logger.info(
    { projectId, userId, groupId: linkedFileData.zoteroGroupId },
    'creating Zotero linked file'
  )

  linkedFileData.importedByUserId = userId

  const bibtex = await _getBibtex(userId, linkedFileData)

  const file = await LinkedFilesHandler.promises.importContent(
    projectId,
    bibtex,
    _sanitizeData(linkedFileData),
    name,
    parentFolderId,
    userId
  )
  return file._id
}

async function refreshLinkedFile(
  projectId,
  linkedFileData,
  name,
  parentFolderId,
  userId
) {
  logger.info(
    { projectId, userId, groupId: linkedFileData.zoteroGroupId },
    'refreshing Zotero linked file'
  )

  if (linkedFileData.importedByUserId) {
    if (linkedFileData.importedByUserId !== userId) {
      throw new NotOriginalImporterError(
        'Only the user who created the Zotero-linked file can refresh this file'
      )
    }
  } else {
    const project = await Project.findById(projectId, 'owner_ref').lean()
    if (!project || String(project.owner_ref) !== String(userId)) {
      throw new NotOriginalImporterError(
        'Only the user who created the Zotero-linked file can refresh this file'
      )
    }
    linkedFileData.importedByUserId = userId
  }

  const bibtex = await _getBibtex(userId, linkedFileData)

  const file = await LinkedFilesHandler.promises.importContent(
    projectId,
    bibtex,
    _sanitizeData(linkedFileData),
    name,
    parentFolderId,
    userId
  )
  return file._id
}

async function _getBibtex(userId, linkedFileData) {
  try {
    if (linkedFileData.zoteroGroupId) {
      return await ZoteroApiClient.getGroupLibraryBibtex(
        userId,
        linkedFileData.zoteroGroupId
      )
    }
    return await ZoteroApiClient.getUserLibraryBibtex(userId)
  } catch (err) {
    if (err instanceof ZoteroForbiddenError) {
      throw new AccessDeniedError('Zotero access denied').withCause(err)
    }
    if (err instanceof ZoteroAccountNotLinkedError) {
      throw new AccessDeniedError('Zotero account not linked').withCause(err)
    }
    throw new RemoteServiceError('Zotero API error').withCause(err)
  }
}

function _sanitizeData(data) {
  return {
    provider: 'zotero',
    zoteroGroupId: data.zoteroGroupId || undefined,
    importedAt: data.importedAt,
    importedByUserId: data.importedByUserId || undefined,
  }
}

export default {
  createLinkedFile: callbackify(createLinkedFile),
  refreshLinkedFile: callbackify(refreshLinkedFile),
  promises: { createLinkedFile, refreshLinkedFile },
}
