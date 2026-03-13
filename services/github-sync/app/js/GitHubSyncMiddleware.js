import pLimit from 'p-limit'

const projectLimiters = new Map()

function getProjectLimiter(projectId) {
  if (!projectLimiters.has(projectId)) {
    projectLimiters.set(projectId, pLimit(1))
  }
  return projectLimiters.get(projectId)
}

export function projectConcurrencyMiddleware(req, res, next) {
  const projectId = req.params.Project_id
  if (!projectId) return res.status(400).json({ error: 'Missing Project_id' })
  const limiter = getProjectLimiter(projectId)

  limiter(() => new Promise(resolve => {
    let released = false
    const releaseOnce = () => {
      if (released) return
      released = true
      resolve()
    }

    req._releaseLimiter = releaseOnce

    res.on('finish', releaseOnce)
    res.on('close', releaseOnce)

    next()
  }))
}

