import { Project } from '../../../../app/src/models/Project.mjs'
import GitHubApiClient from './GitHubApiClient.mjs'
import { GitHubSyncUserCredentials } from '../models/githubSyncUserCredentials.mjs'
import { GitHubSyncProjectStates } from '../models/githubSyncProjectStates.mjs'
import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
import SecretsHelper from './SecretsHelper.mjs'
import GitHubSyncUpdater from './GitHubSyncUpdater.mjs'
import { fetchJson } from '@overleaf/fetch-utils'

/**
 * Get user's GitHub sync status
 */
async function getUserGitHubStatus(userId) {
  const credentials = await GitHubSyncUserCredentials.findOne({ userId }).lean()
  if (!credentials) {
    return { available: true, enabled: false }
  }

  // test if the token is still valid by making an API call to GitHub
  const token = await SecretsHelper.decryptAccessToken(credentials.auth_token_encrypted)
  try {
    await GitHubApiClient.listRepos(token, 1, 1) // just list 1 repo to check token validity
  } catch (err) {
    logger.warn({ userId, err }, 'GitHub token invalid, treating as not connected')
    return { available: true, enabled: false }
  }

  return {
    available: true,
    enabled: true
  }
}

/**
 * Get project's GitHub sync status
 */
async function getProjectGitHubSyncStatus(projectId) {
  const projectStatus = await GitHubSyncProjectStates.findOne({ projectId }, 
    { 
      _id: 0, __v: 0, 
      // last_sync_sha: 0, 
      // last_sync_version: 0,
    }
  ).lean()
  if (!projectStatus) {
    return { enabled: false }
  }
  projectStatus.enabled = true
  return projectStatus
}

/**
 * Save project's GitHub sync status
 */
async function updateProjectGitHubSyncStatus(projectId, updateFields) {
  logger.debug({ projectId, updateFields }, 'Updating project GitHub sync status')
  const projectStatus = await GitHubSyncProjectStates.findOneAndUpdate(
    { projectId },
    { $set: updateFields },
    { new: true, upsert: false, fields: { _id: 0, __v: 0 } }
  ).lean()

  if (!projectStatus) {
    throw new Error('Project GitHub sync status not found')
  }
  return projectStatus
}

/**
 * Delete project's GitHub sync status
 */
async function deleteProjectGitHubSyncStatus(projectId) {
  await GitHubSyncProjectStates.deleteOne({ projectId })
}

/**
 * List user's GitHub repositories
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function listUserRepos(userId) {
  const pat = await getGitHubAccessTokenForUser(userId)
  if (!pat) {
    throw new Error('GitHub not connected')
  }

  return await GitHubApiClient.listAllRepos(pat)
}


/**
 * Get project's GitHub sync status, directly from db.
 */
async function getProjectSyncStatus(projectId) {
  const projectStatus = await GitHubSyncProjectStates.findOne({ projectId }, { _id: 0, __v: 0 }).lean()
  if (!projectStatus) {
    return { enabled: false }
  }
  return projectStatus
}


// This function would exchange the OAuth code for an access token with GitHub
// For security, this should be done server-side and not exposed to the client
// The implementation would involve making a POST request to GitHub's token endpoint
// with the client ID, client secret, and the code received from the OAuth callback
async function exchangeCodeForToken(code) {
  return await GitHubApiClient.exchangeCodeForPat(code)
}

// Save the GitHub access token for a user, encrypted in the database
async function saveGitHubAccessTokenForUser(userId, accessToken) {
  const tokenEncrypted = await SecretsHelper.encryptAccessToken(accessToken)
  // save tp database
  await GitHubSyncUserCredentials.findOneAndUpdate(
    { userId },
    {
      $set: { auth_token_encrypted: tokenEncrypted },
      $setOnInsert: { userId },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  )
}

// Save githubSyncProjectStates for a project
async function saveNewlySyncedProjectState(projectId, ownerId, repo, sha, branch, ver) {
  let gitHubSyncProjectStates = new GitHubSyncProjectStates()
  gitHubSyncProjectStates.projectId = projectId
  gitHubSyncProjectStates.ownerId = ownerId
  gitHubSyncProjectStates.repo = repo
  gitHubSyncProjectStates.merge_status = 'success'
  gitHubSyncProjectStates.last_sync_sha = sha
  gitHubSyncProjectStates.default_branch = branch
  gitHubSyncProjectStates.last_sync_sha = sha
  gitHubSyncProjectStates.last_sync_version = ver
  await gitHubSyncProjectStates.save()
}



/**
 * Remove a user's GitHub access token from the database.
 * Revokes the token with GitHub before deleting it locally.(try)
 * @param {string} userId - User ID
 */
async function removeGitHubAccessTokenForUser(userId) {
  let token = await getGitHubAccessTokenForUser(userId)
  if (token) {
    await GitHubApiClient.revokePat(token)
  }
  await GitHubSyncUserCredentials.deleteMany({ userId })
}

/**
 * Get a user's GitHub token
 * @param {string} userId - User ID
 */
async function getGitHubAccessTokenForUser(userId) {
  const credentials = await GitHubSyncUserCredentials.findOne({ userId }).lean()
  if (!credentials) {
    return null
  }
  return await SecretsHelper.decryptAccessToken(credentials.auth_token_encrypted)
}

/**
 * Get a repo's basic info
 * @param {string} userId - User ID
 */
async function getRepoInfo(userId, repoFullName) {
  const pat = await getGitHubAccessTokenForUser(userId)
  if (!pat) {
    throw new Error('GitHub not connected')
  }

  return await GitHubApiClient.getRepoInfo(pat, repoFullName)
}

async function getGitHubOrgsForUser(userId) {
  const pat = await getGitHubAccessTokenForUser(userId)
  if (!pat) {
    throw new Error('GitHub not connected')
  }

  const orgs = await GitHubApiClient.listOrgs(pat)
  const user = await GitHubApiClient.listUser(pat)
  return { user: user, orgs: orgs }
}

async function exportProjectToGitHub(userId, projectId, name, description, isPrivate, org) {
  const url = `${Settings.apis.github_sync.url}/project/${projectId}/user/${userId}/export`

  logger.debug({ userId, projectId, url }, 'Exporting project to GitHub')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description, private: isPrivate, org }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`GitHub Sync Service error: ${response.status} - ${error.error || error}`)
  }

  return await response.json()
}


async function listCommitsSince(userId, repoFullName, branch, since) {
  const pat = await getGitHubAccessTokenForUser(userId)
  if (!pat) {
    throw new Error('GitHub not connected')
  }
  return await GitHubApiClient.listCommitsSince(pat, repoFullName, branch, since)
}

async function syncProjectToGitHub(userId, projectId, message) {
  const url = `${Settings.apis.github_sync.url}/project/${projectId}/user/${userId}/merge`
  logger.debug({ userId, projectId, url }, 'Syncing project to GitHub')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`GitHub Sync Service error: ${response.status} - ${error.error || error}`)
  }

  return await response.json()
}


// 1. apply changes
// 2. update project sync status
// 3. return ok, client will fetch status again.
async function applyChangesToOverleaf(projectId, newSha, files, userId) {
  const token = await getGitHubAccessTokenForUser(userId)

  if (!token) {
    throw new Error('GitHub not connected')
  }

  try {
    await GitHubSyncUpdater.promises.postSnapshot(projectId, files, userId, token)
    // Re get projectID and version
    const snapshot = await fetchJson(
      `${Settings.apis.project_history.url}/project/${projectId}/version`
    )
    const projectVersion = snapshot.version


    // get latest version in overleaf
    await updateProjectGitHubSyncStatus(projectId, 
      { 
        merge_status: 'success',
        last_sync_version: projectVersion,
        last_sync_sha: newSha,
        unmerged_branch: null, // clear unmerged branch if any
      })
  } catch (err) {
    logger.error({ err, projectId, newSha }, 'Failed to apply changes to Overleaf')
    throw err
  }
  
}

async function getRepoZipball(userId, repoFullName, latestCommitSha) {
  const pat = await getGitHubAccessTokenForUser(userId)
  if (!pat) {
    throw new Error('GitHub not connected')
  }

  return await GitHubApiClient.getRepoZipball(pat, repoFullName, latestCommitSha)
}

export default {
  promises: {
    getUserGitHubStatus,
    getProjectGitHubSyncStatus,
    listUserRepos,
    getProjectSyncStatus,
    exchangeCodeForToken,
    saveGitHubAccessTokenForUser,
    removeGitHubAccessTokenForUser,
    getGitHubAccessTokenForUser,
    getRepoInfo,
    getRepoZipball,
    saveNewlySyncedProjectState,
    getGitHubOrgsForUser,
    exportProjectToGitHub,
    listCommitsSince,
    syncProjectToGitHub,
    applyChangesToOverleaf,
    deleteProjectGitHubSyncStatus,
  },
}