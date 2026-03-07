import logger from '@overleaf/logger'
import { GitHubSyncProjectStates, GitHubSyncUserCredentials } from './modals/index.js'
import { ObjectId } from './mongodb.js'
import SecretHelper from './SecretHelper.js'
import Settings from '@overleaf/settings'
import HttpsProxyAgent from 'https-proxy-agent'
import fetch from 'node-fetch'

const GITHUB_API_BASE = 'https://api.github.com'
const proxyUrl = process.env.GITHUB_SYNC_PROXY_URL
const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined


async function getProjectGitHubSyncStatus(projectId) {
  return GitHubSyncProjectStates.findByProjectId(projectId)
}

async function saveProjectGitHubSyncStatus(projectId, status) {
  return GitHubSyncProjectStates.saveByProjectId(projectId, status)
}

async function updateProjectGitHubSyncStatus(projectId, status) {
  return GitHubSyncProjectStates.updateByProjectId(projectId, status)
}


async function getUserGitHubCredentials(userId) {
  const credentials = await GitHubSyncUserCredentials.findByUserId(userId)
  if (!credentials) {
    return null
  }
  return await SecretHelper.decryptAccessToken(credentials.auth_token_encrypted)
}


// This function will create a repository on GitHub for the project
// If org is provided, it will create the repository under the organization, 
//    otherwise it will create the repository under the user's account.
// We will initialize the repository with a README file, and then we will 
//    remove the README file later, because we need to make sure the repository 
//    is not empty, otherwise GitHub API will reject our commit.
// No other initialization is done in this function.
async function createRepositoryOnGitHub(userId, repoName, repoDescription, isPrivate, org) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const githubApiUrl = org
    ? `${GITHUB_API_BASE}/orgs/${org}/repos`
    : `${GITHUB_API_BASE}/user/repos`

  const response = await fetch(githubApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
    body: JSON.stringify({
      name: repoName,
      description: repoDescription,
      private: isPrivate,
      auto_init: true, // we need this, but will remove later.
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    logger.error('Failed to create GitHub repository', { userId, repoName, error: errorData })
    throw new Error(`Repository creation failed.`)
  }

  const repoData = await response.json()
  return repoData
}




// Request files list from project history, should return like this
// {
//   "projectId": "699fbae90f632055939d7a5d",
//   "files": {
//     "main.tex": {
//       "data": {
//         "hash": "fd3c0326302e49486d3ea86c833edf9b88320c41"
//       }
//     },
//     "sample.bib": {
//       "data": {
//         "hash": "a0e21c740cf81e868f158e30e88985b5ea1d6c19"
//       }
//     },
//     "frog.jpg": {
//       "data": {
//         "hash": "5b889ef3cf71c83a4c027c4e4dc3d1a106b27809"
//       }
//     },
// }
// We added version for next step to pull file contents.
async function getProjectLatestVersion(projectId) {
  let verURL = `${Settings.apis.project_history.url}/project/${projectId}/version`
  const response = await fetch(verURL)
  if (!response.ok) {
    const errorData = await response.json()
    logger.error('Failed to pull project version from Project History', { projectId, error: errorData })
    throw new Error(`Project History API error: ${errorData.message}`)
  }
  const versionData = await response.json()
  const latestVersion = versionData.version

  let URL = `${Settings.apis.project_history.url}/project/${projectId}/version/${latestVersion}`
  const fileResponse = await fetch(URL)
  if (!fileResponse.ok) {
    const errorData = await fileResponse.json()
    logger.error('Failed to pull project files from Project History', { projectId, version: latestVersion, error: errorData })
    throw new Error(`Project History API error: ${errorData.message}`)
  }

  let result = await fileResponse.json()
  result.version = latestVersion
  return result
}


// Communicate with project history service to get the file tree diff 
// between two versions, and return a array
// If operation appeared, it means it has been changed.
// operation can be "added", "removed", "edited".
// [
//     {
//       "pathname": "main.tex",
//       "editable": true
//     },
//     {
//       "pathname": "sample.bib",
//       "operation": "removed",
//       "editable": true,
//       "deletedAtV": 5
//     },
//     {
//       "pathname": "frog.jpg",
//       "operation": "added",
//       "editable": false
//     },
//     {
//       "pathname": "4535345345/3453453.tex",
//       "operation": "added",
//       "editable": true
//     }
// ]
async function getProjectFileTreeDiff(projectId, fromVersion, toVersion) {
  let historyURL = `${Settings.apis.project_history.url}/project/${projectId}/filetree/diff?from=${fromVersion}&to=${toVersion}`
  const response = await fetch(historyURL)
  if (!response.ok) {
    const errorData = await response.json()
    logger.error('Failed to pull project file tree diff from Project History', { projectId, fromVersion, toVersion, error: errorData })
    throw new Error(`Project History API error: ${errorData.message}`)
  }
  const diffData = await response.json()

  if (!diffData || !diffData.diff) {
    return []
  }
  return diffData.diff
}


async function uploadBlobToGitHub(repoFullName, filePath, buffer, accessToken) {
  const encoding = 'base64'
  const content = buffer.toString('base64')

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/blobs`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
    body: JSON.stringify({
      content,
      encoding,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    logger.error('Failed to upload blob to GitHub', { repoFullName, filePath, error: errorData })
    throw new Error(`GitHub API error: ${errorData.message}`)
  }

  const blobData = await response.json()
  return blobData.sha
}

async function createTreeOnGitHub(repoFullName, blobShas, accessToken, baseTreeSha = null) {
  const body = {
    tree: blobShas.map(item => ({
      path: item.path,
      sha: item.sha,
      mode: '100644',
      type: 'blob',
    })),
  }
  if (baseTreeSha) {
    body.base_tree = baseTreeSha
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/trees`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json()
    logger.error('Failed to create tree on GitHub', { repoFullName, error: errorData })
    throw new Error(`GitHub API error: ${errorData.message}`)
  }

  const treeData = await response.json()
  return treeData.sha
}


async function createCommitOnGitHub(repoFullName, treeSha, message, accessToken, parents = []) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/commits`, {
    method: 'POST',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: parents,
    }),
    agent: httpsAgent,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.error('Failed to create commit on GitHub', { repoFullName, error: errorData })
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }

  const commitData = await response.json()
  return commitData.sha
}

async function getBranchHeadCommitSha(repoFullName, branch, userId) {
  const accessToken = await getUserGitHubCredentials(userId)

  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/ref/heads/${branch}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (response.status === 404) return null
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }

  const refData = await response.json()
  return refData?.object?.sha || null
}

// We need to remove init README.
async function updateBranchToCommit(
  repoFullName, branch, commitSha, accessToken, ifForce = false
) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${repoFullName}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitSha,
        force: ifForce,
      }),
      agent: httpsAgent,
    }
  )

  const text = await response.text().catch(() => '')
  if (!response.ok) {
    let err = {}
    try { err = JSON.parse(text) } catch { }
    logger.error({ repoFullName, branch, commitSha, status: response.status, body: text }, 'Failed to force update ref')
    throw new Error(`GitHub API error: ${err.message || text || response.statusText}`)
  }

  return JSON.parse(text)
}

// Communicate with project history service to get the file content buffer, and return the buffer.
async function getProjectFileBuffer(projectId, version, filePath) {
  const fileURL = `${Settings.apis.project_history.url}/project/${projectId}/version/${version}/${encodeURIComponent(filePath)}`
  const response = await fetch(fileURL)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.error({ projectId, version, filePath, errorData }, 'Failed to fetch file snapshot')
    throw new Error(`Project History API error: ${errorData.message || response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

// Export a project to GitHub will be a complex process,
//   1. We need to get the latest version of the project, and get the file list with their hashes from project history service.
//   2. Then we need to pull the file contents from project history service, and upload the file blobs to GitHub, and get the blob shas.
//   3. Then, we need to create a tree with all the blobs, and create a commit with the tree, and finally update the ref of the repo to point to the new commit.
//   4. Finally, we need to save the GitHub sync status to the database, so we can show the status on the UI.
async function initializeRepositoryForProject(projectId, userId, repoFullName, defaultBranch) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  let blobShas = []
  try {
    // Get latest version, then ask for file contents.
    const latestVersionData = await getProjectLatestVersion(projectId)
    const latestVersion = latestVersionData.version

    for (const filePath in latestVersionData.files) {
      const buffer = await getProjectFileBuffer(projectId, latestVersion, filePath)
      const blobSha = await uploadBlobToGitHub(repoFullName, filePath, buffer, accessToken)
      blobShas.push({ path: filePath, sha: blobSha })
      logger.debug({ projectId, filePath, blobSha },
        'Uploaded file blob to GitHub Successfully')
    }

    // Then, we need to create a tree with all the blobs, and 
    // create a commit with the tree, and finally update the ref 
    // of the repo to point to the new commit.
    const treeSha = await createTreeOnGitHub(
      repoFullName, blobShas, accessToken, null)
    
    const commitSha = await createCommitOnGitHub(
      repoFullName, treeSha, `Initial Overleaf Import`, accessToken)

    const updateRefResult = await updateBranchToCommit(
      repoFullName, defaultBranch, commitSha, accessToken, true)

    logger.debug({ projectId, repoFullName, treeSha, commitSha, updateRefResult }, 
      'Created initial commit on GitHub Successfully')

    // Finally, we need to save the GitHub sync status to the database,
    //  so we can show the status on the UI.
    return await saveProjectGitHubSyncStatus(projectId, {
      merge_status: 'success',
      default_branch: defaultBranch,
      unmerged_branch: null,
      last_sync_sha: commitSha,
      last_sync_version: latestVersion,
      repo: repoFullName,
      ownerId: new ObjectId(userId),
    })
  } catch (err) {
    logger.error({ err, projectId }, 'Error initializing GitHub repository for project')
    throw err
  }
}

// This function will export all changes in overleaf to github
async function exportChangesToGitHub(
  projectId, userId, repoFullName, branch,
  fromV, toV, parentCommitSha, commitMessage
) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }
  const diff = await getProjectFileTreeDiff(projectId, fromV, toV)
  const upsertPaths = new Set()
  const deletePaths = new Set()

  for (const item of diff) {
    if (!item?.operation) continue

    if (item.operation === 'added' || item.operation === 'edited') {
      upsertPaths.add(item.pathname)
      continue
    }

    if (item.operation === 'removed') {
      deletePaths.add(item.pathname)
      continue
    }

    if (item.operation === 'renamed') {
      deletePaths.add(item.pathname)
      if (item.newPathname) upsertPaths.add(item.newPathname)
      continue
    }
  }

  // 冲突消解：同路径既删又改，按“保留最终文件”处理
  for (const p of upsertPaths) {
    if (deletePaths.has(p)) deletePaths.delete(p)
  }

  const changed = Array.from(upsertPaths)
  const removed = Array.from(deletePaths)

  // 没变化直接返回
  if (changed.length === 0 && removed.length === 0) {
    return {
      noChange: true,
      commitSha: parentCommitSha,
      changed,
      removed,
    }
  }

  const treeEntries = []

  // 处理新增/修改：拉最新版本文件 -> upload blob
  for (const filePath of changed) {
    const buffer = await getProjectFileBuffer(projectId, toV, filePath)
    const blobSha = await uploadBlobToGitHub(repoFullName, filePath, buffer, accessToken)
    treeEntries.push({ path: filePath, sha: blobSha })
  }

  // 处理删除：sha=null
  for (const filePath of removed) {
    treeEntries.push({ path: filePath, sha: null })
  }

  const baseTreeSha = await getCommitTreeSha(repoFullName, parentCommitSha, accessToken)
  const treeSha = await createTreeOnGitHub(repoFullName, treeEntries, accessToken, baseTreeSha)

  const commitSha = await createCommitOnGitHub(
    repoFullName,
    treeSha,
    commitMessage || `Sync Overleaf changes v${fromV}..v${toV}`,
    accessToken,
    [parentCommitSha]
  )

  await createOrUpdateBranchRef(repoFullName, branch, commitSha, userId)

  return {
    noChange: false,
    commitSha,
    treeSha,
    changed,
    removed,
  }
}

// create a new branch from commitSha
// if the branch already exists, we will update the branch to point to the new commitSha
// but only if the branch is currently pointing to the commitSha, 
// otherwise we consider it as a conflict and throw an error.
async function createOrUpdateBranchRef(repoFullName, branch, commitSha, userId) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }
  const headSha = await getBranchHeadCommitSha(repoFullName, branch, userId)

  if (!headSha) {
    const createResp = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/refs`, {
      method: 'POST',
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commitSha,
      }),
      agent: httpsAgent,
    })
    if (!createResp.ok) {
      const errorData = await createResp.json().catch(() => ({}))
      throw new Error(`GitHub API error: ${errorData.message || createResp.statusText}`)
    }
    return
  }

  const updateResp = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sha: commitSha,
      force: false,
    }),
    agent: httpsAgent,
  })

  if (!updateResp.ok) {
    const errorData = await updateResp.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || updateResp.statusText}`)
  }
}


async function deleteBranchOnGitHub(repoFullName, branch, userId) {
  logger.debug({ repoFullName, branch }, 'Deleting branch on GitHub')
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const url = `${GITHUB_API_BASE}/repos/${repoFullName}/git/refs/heads/${branch}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (response.status === 404) {
    logger.warn({ repoFullName, branch }, 'Branch not found when trying to delete, ignoring')
    return
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.warn(
      { repoFullName, branch, status: response.status, error: errorData },
      'Failed to delete branch on GitHub'
    )
  }

  logger.debug({ repoFullName, branch, status: response.status }, 'Deleted branch on GitHub')
}


async function getCommitTreeSha(repoFullName, commitSha, accessToken) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/commits/${commitSha}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }

  const commitData = await response.json()
  return commitData?.tree?.sha
}

async function mergeBranchToDefaultBranch(repoFullName, sourceBranch, defaultBranch, userId) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/merges`, {
    method: 'POST',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base: defaultBranch,
      head: sourceBranch,
      commit_message: `Merge ${sourceBranch} to ${defaultBranch}`,
    }),
    agent: httpsAgent,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }

  const mergeData = await response.json()
  return mergeData
}

async function fastForwardBranchToDefaultBranch(repoFullName, sourceBranch, defaultBranch, userId) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const sourceHeadSha = await getBranchHeadCommitSha(repoFullName, sourceBranch, userId)
  if (!sourceHeadSha) {
    throw new Error(`Source branch ${sourceBranch} not found`)
  }


  // Fast forward the default branch to the source branch head sha, if possible.
  let ffResult = await updateBranchToCommit(
    repoFullName, defaultBranch, sourceHeadSha, accessToken, false
  )

  return {
    ...ffResult,
    sha: ffResult?.object?.sha || sourceHeadSha,
  }
}


async function diffChangesOnGitHub(repoFullName, baseBranch,
  fromSha, toSha, userId) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/compare/${fromSha}...${toSha}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }

  const compareData = await response.json()
  return compareData.files || []
}


// We do a workarount here
// if user delete that branch on GitHub, we will consider merge successful
// Return [] means no diff.
async function diffBranchsOnGitHub(
  repoFullName, baseBranch, compareBranch, userId
){
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/compare/${baseBranch}...${compareBranch}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.error('Failed to diff branches on GitHub', { repoFullName, baseBranch, compareBranch, error: errorData })

    // treat 404 as no diff.
    if (errorData.status === '404' || response.status === 404) {
      return []
    }
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }
  const compareData = await response.json()
  return compareData.files || []
}

// Return File list on Github on a specific commit.
async function getFileTreeOnCommit(repoFullName, commitSha, userId) {
  const accessToken = await getUserGitHubCredentials(userId)
  if (!accessToken) {
    throw new Error('User does not have GitHub credentials')
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/git/commits/${commitSha}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || response.statusText}`)
  }

  const commitData = await response.json()
  const treeURL = commitData?.tree?.url + `?recursive=1`
  if (!treeURL) {
    throw new Error('Invalid commit data from GitHub API: missing tree url')
  }

  const treeResponse = await fetch(treeURL, {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    agent: httpsAgent,
  })

  if (!treeResponse.ok) {
    const errorData = await treeResponse.json().catch(() => ({}))
    throw new Error(`GitHub API error: ${errorData.message || treeResponse.statusText}`)
  }

  const treeData = await treeResponse.json()
  return treeData.tree || []
}

// diff:
// [
//   {
//       "sha": "f2e6004eece8a664d1c603ff1a0b6b13400553fb",
//       "filename": "develop/dev.env",
//       "status": "modified",
//       "additions": 1,
//       "deletions": 0,
//       "changes": 1,
//       "blob_url": "https://github.com/overleaf/overleaf/blob/17e01526b48b070a374cca24d779c462336560ae/develop%2Fdev.env",
//       "raw_url": "https://github.com/overleaf/overleaf/raw/17e01526b48b070a374cca24d779c462336560ae/develop%2Fdev.env",
//       "contents_url": "https://api.github.com/repos/overleaf/overleaf/contents/develop%2Fdev.env?ref=17e01526b48b070a374cca24d779c462336560ae",
//       "patch": "@@ -1,5 +1,6 @@\n CHAT_HOST=chat\n CLSI_HOST=clsi\n+DOWNLOAD_HOST=clsi-nginx\n CONTACTS_HOST=contacts\n DOCSTORE_HOST=docstore\n DOCUMENT_UPDATER_HOST=document-updater"
//   },
//   ...
// ]


// tree
// [
//   {
//     "path": "main.tex",
//     "mode": "100644",
//     "type": "blob",
//     "sha": "3d21ec53a331a6f037a91c368710b99387d012c1"
//     "size": 30,
//     "url": "https://api.github.com/repos/octocat/Hello-World/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1"
//   },
//   ...
// ]
function generateRespURL(diff, tree, repoFullName, newSha) {
  const resp = []
  const BaseURL = `${GITHUB_API_BASE}/repos/${repoFullName}/contents/`
  for (const item of tree) {
    if (item.type !== 'blob') continue
    let obj = {
      name: item.path,
    }

    // if item.path exists in diff, we put url in that
    const diffItem = diff.find(d => d.filename === item.path)
    if (diffItem) {
      obj.url = `${BaseURL}${item.path}?ref=${newSha}`
    }
    resp.push(obj)
  }
  return resp
}



export default {
  promises: {
    getProjectGitHubSyncStatus,
    getUserGitHubCredentials,
    getFileTreeOnCommit,
    createRepositoryOnGitHub,
    createOrUpdateBranchRef,
    getCommitTreeSha,
    initializeRepositoryForProject,
    getProjectFileTreeDiff,
    exportChangesToGitHub,
    mergeBranchToDefaultBranch,
    diffChangesOnGitHub,
    getProjectLatestVersion,
    getBranchHeadCommitSha,
    updateProjectGitHubSyncStatus,
    saveProjectGitHubSyncStatus,
    diffBranchsOnGitHub,
    deleteBranchOnGitHub,
    fastForwardBranchToDefaultBranch
  },
  generateRespURL,
}
