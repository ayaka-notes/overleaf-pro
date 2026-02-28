import logger from '@overleaf/logger'
import fetch from 'node-fetch'
import Settings from '@overleaf/settings'
import { HttpsProxyAgent } from 'https-proxy-agent'

const GITHUB_API_BASE = 'https://api.github.com'

// For example: 'http://127.0.0.1:1080'
const proxyUrl = process.env.GITHUB_SYNC_PROXY_URL
const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined


/**
 * Create headers for GitHub API requests
 * @param {string} pat - Personal Access Token
 * @returns {Object}
 */
function getHeaders(pat) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${pat}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Overleaf-GitHub-Sync',
  }
}

/**
 * Verify PAT and get user info
 * @param {string} pat - Personal Access Token
 * @returns {Promise<{login: string, id: number, name: string}>}
 */
async function verifyPat(pat) {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(pat),
    agent: httpsAgent,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid GitHub Personal Access Token')
    }
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const user = await response.json()
  return {
    login: user.login,
    id: user.id,
    name: user.name,
  }
}

/**
 * List 100 repositories for the authenticated user
 */
async function listRepos(pat, page = 1, perPage = 100) {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    sort: 'updated',
    direction: 'desc',
  })

  const response = await fetch(
    `${GITHUB_API_BASE}/user/repos?${params.toString()}`,
    {
      headers: getHeaders(pat),
      agent: httpsAgent,
    }
  )

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  let repos = await response.json()

  return repos.map(repo => ({
    name: repo.name,
    fullName: repo.full_name,
  }))
}

/**
 * List All repositories for the authenticated user
 */
async function listAllRepos(pat) {
  let page = 1
  const perPage = 100
  let allRepos = []
  while (true) {
    const repos = await listRepos(pat, page, perPage)
    allRepos = allRepos.concat(repos)
    if (repos.length < perPage) break
    page++
  }
  return allRepos
}

/**
 * Get repository info
 * @param {string} pat - Personal Access Token
 * @param {string} fullName - Full repository name (e.g. "owner/repo")
 * @returns {Promise<{fullName: string, defaultBranch: string, latestCommitSha: string}>}
 */
async function getRepoInfo(pat, fullName) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${fullName}`, {
    headers: getHeaders(pat),
    agent: httpsAgent,
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found or access denied')
    }
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const repo = await response.json()
  const defaultBranch = repo.default_branch

  const branchResp = await fetch(
    `${GITHUB_API_BASE}/repos/${fullName}/branches/${encodeURIComponent(defaultBranch)}`,
    { headers: getHeaders(pat), agent: httpsAgent }
  )

  if (!branchResp.ok) {
    throw new Error(`GitHub API error: ${branchResp.status}`)
  }

  const branch = await branchResp.json()

  return {
    fullName: repo.full_name,
    defaultBranch: repo.default_branch,
    latestCommitSha: branch.commit?.sha,
  }
}

async function listOrgs(pat) {
  const response = await fetch(`${GITHUB_API_BASE}/user/orgs`, {
    headers: getHeaders(pat),
    agent: httpsAgent,
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const orgs = await response.json()
  return orgs.map(org => ({
    login: org.login,
  }))
}

async function listUser(pat) {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(pat),
    agent: httpsAgent,
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const user = await response.json()

  return {
    login: user.login
  }
}

async function revokePat(token) {
  const ULR = `${GITHUB_API_BASE}/applications/${Settings.githubSync.clientID}/token`
  const clientId = Settings.githubSync.clientID
  const clientSecret = Settings.githubSync.clientSecret

  if (!clientId || !clientSecret) {
    logger.warn('GitHub client ID or secret not configured, skipping token revocation')
    return
  }

  const Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  const resp = await fetch(ULR, {
    method: 'DELETE',
    agent: httpsAgent,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': Authorization,
    },
    body: JSON.stringify({ access_token: token }),
  })

  if (!resp.ok) {
    logger.warn(`Failed to revoke GitHub token: ${resp.status} ${await resp.text()}`)
  }
}



// This function would exchange the OAuth code for an access token with GitHub
// For security, this should be done server-side and not exposed to the client
// The implementation would involve making a POST request to GitHub's token endpoint
// with the client ID, client secret, and the code received from the OAuth callback
async function exchangeCodeForPat(code) {
  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    agent: httpsAgent,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: Settings.githubSync.clientID,
      client_secret: Settings.githubSync.clientSecret,
      code,
      redirect_uri: Settings.githubSync.callbackURL,
    }),
  })

  const data = await resp.json()
  if (!resp.ok || data.error) {
    throw new Error(
      `GitHub token exchange failed: ${data.error || resp.status} ${data.error_description || ''}`.trim()
    )
  }

  return data
}

async function listCommitsSince(pat, fullName, branch, sinceCommitSha) {
  logger.info({ fullName, branch, sinceCommitSha }, 'Listing commits since last sync')

  if (!sinceCommitSha) {
    return []
  }

  const url = `${GITHUB_API_BASE}/repos/${fullName}/compare/` +
    `${encodeURIComponent(sinceCommitSha)}...${encodeURIComponent(branch)}`

  const response = await fetch(url, {
    headers: getHeaders(pat),
    agent: httpsAgent,
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found or access denied')
    }
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const data = await response.json()

  const commits = (data.commits || []).map(c => ({
    message: c.commit?.message || '',
    author: {
      name: c.commit?.author?.name || '',
      email: c.commit?.author?.email || '',
      date: c.commit?.author?.date || '',
    },
    sha: c.sha,
  }))

  return commits
}

async function getRepoZipball(pat, repoFullName, latestCommitSha) {
  const url = `${GITHUB_API_BASE}/repos/${repoFullName}/zipball/${latestCommitSha}`
  const headers = {
    Authorization: `token ${pat}`,
    Accept: 'application/vnd.github.v3+json',
  }

  const response = await fetch(url, {
    headers,
    agent: httpsAgent,
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`)
  }

  return response
}

export default {
  exchangeCodeForPat,
  verifyPat,
  revokePat,
  listRepos,
  listAllRepos,
  listOrgs,
  listUser,
  getRepoInfo,
  getRepoZipball,
  listCommitsSince,
}