import { GitHubSyncProjectStates } from './modals/index.js'
import GithubSyncHandler from './GitHubSyncHandler.js'
import { expressify } from '@overleaf/promise-utils'
import logger from '@overleaf/logger'


// This function will create a new repo on GitHub, export current project to that repo,
// and link the repo with the project by saving sync status in database.
// body: {name: "xxx", description: "xxx", private: true, org: "github-org-name"}
// name:         the name of the repo to be created on GitHub, required
// description:  the description of the repo to be created on GitHub, optional
// private:      whether the repo is private or not, required
// org:          if provided, the repo will be created under the organization,
//                  otherwise it will be created under user's account.
async function exportProjectToGithub(req, res, next) {
  const { Project_id: projectId, user_id: userId } = req.params
  const { name, description, private: isPrivate, org } = req.body
  // org can be optional
  if (!projectId || !name || isPrivate === undefined) {
    return res.status(400).json({ error: 'Project_id, name and private are required' })
  }

  try {
    const projectStatus = await GithubSyncHandler.promises.getProjectGitHubSyncStatus(projectId)
    if (projectStatus) {
      return res.status(400).json({ error: 'Project is already linked to a GitHub repository' })
    }
    const repoResult = await GithubSyncHandler.promises.createRepositoryOnGitHub(
      userId,
      name,
      description,
      isPrivate,
      org
    )

    const repoFullName = repoResult.full_name
    const defaultBranch = repoResult.default_branch
    const statusData = await GithubSyncHandler.promises.initializeRepositoryForProject(
      projectId,
      userId,
      repoFullName,
      defaultBranch
    )

    res.json({ statusData })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// This funcion will check github sync status.
// 0. No merge_status in db, return error, no linked repo.
// 1. If merge_status is `success`
//    a), we will export a changes in overleaf since last sync to github, 
//        as a branch with name `overleaf-2026-02-26-1528`
//    b), we will call api to merge the branch `overleaf-2026-02-26-1528` to default branch in our db.
//    c), If merge success, goto step 3,
//        if failed, we will set merge_status to `failure`, and 
//                           set unmerged_branch to `overleaf-2026-02-26-1528`, 
//                           and return error to client, [end]

// 2. If merge_status is `failure` we will check if there is an unmerged_branch on Github
//     a), if unmerged_branch deleted, we will choose defeault branch latest commit sha as next
//     b), if unmerged_branch still exists, we compare the unmerged_branch with default branch, 
//          [] if unmerged_branch falls behind, do nothing, remain conflict status.
//          [] if unmerged_branch is ahead, we can try to merge unmerged_branch to default 
//                branch, if success, goto step 3, if failed, return error

// 3. we need to remember the new merged sha, and compare it with old sha.
//    a), list the differences between old sha and new sha
//    b), post the changes to web service, give them a [filePath, URL], 
//        just like what we do in git-bridge, we use an internal API/v0
//    c), web service will download URL to a temp folder, and apply all changes to the project
//        this is a realtime API call.

// 4. we need to update the sync status in our db, 
//       set merge_status to `success`, unmerged_branch to null
//       update last_sync_sha to new merged sha, and last_sync_version to version we just merged.
//       [end]

// What should we return?
// If nothing wrong, we return
// {
//   "newSha": string, // the new sha after merge
//   "files": [
//     "name": string, // the file path in overleaf project
//      "url": string, // the url we can download the file content,
//                        null if no changes
//   ] 
// }
// We leave web to to import changes and update project sync infomation.
async function mergeToGitHubAndPushback(req, res, next) {
  logger.info('Received request to merge changes to GitHub and push back changes if needed', { params: req.params })
  const { Project_id: projectId, user_id: userId } = req.params

  let message = 'Sync changes from Overleaf'
  if (req.body && req.body.message) {
    message = req.body.message
  }

  try {
    // Step 0, check if the project is linked to a GitHub repository
    const projectStatus = await GithubSyncHandler.promises.getProjectGitHubSyncStatus(projectId)
    if (!projectStatus) {
      return res.status(400).json({ error: 'Project is not linked to a GitHub repository' })
    }
    let newSha = ""

    // Step 1, last merge success, we can try to merge new changes to github
    if (projectStatus.merge_status === 'success') {
      const latestVersionData = await GithubSyncHandler.promises.getProjectLatestVersion(projectId)
      const latestVersion = latestVersionData.version
      const last_sync_version = projectStatus.last_sync_version
      const last_sync_sha = projectStatus.last_sync_sha
      const branch_latest_sha = await GithubSyncHandler.promises.getBranchHeadCommitSha(
        projectStatus.repo,
        projectStatus.default_branch,
        userId
      )

      // only export changes
      if (latestVersion > last_sync_version) {
        // create a new branch from last_sync_sha
        const now = new Date()
        const branchName = `overleaf-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

        const branchCreated = await GithubSyncHandler.promises.createOrUpdateBranchRef(
          projectStatus.repo,
          branchName,
          last_sync_sha,
          userId
        )

        // export changes to github
        await GithubSyncHandler.promises.exportChangesToGitHub(
          projectId,
          userId,
          projectStatus.repo,
          branchName,
          last_sync_version,
          latestVersion,
          last_sync_sha,
          message
        )

        // Try merge the branch to default branch, if failed, record.
        try {
          if (branch_latest_sha !== last_sync_sha) {
            const mergeResult = await GithubSyncHandler.promises.mergeBranchToDefaultBranch(
              projectStatus.repo,
              branchName,
              projectStatus.default_branch,
              userId
            )
            newSha = mergeResult.sha
          } else {
            // we need to fast-forward the default branch
            const mergeResult = await GithubSyncHandler.promises.fastForwardBranchToDefaultBranch(
              projectStatus.repo,
              branchName,
              projectStatus.default_branch,
              userId
            )
            newSha = mergeResult.sha
          }



          logger.debug({ projectId, branchName, newSha }, 'Branch merged to default branch successfully')
          // delete overleaf branch 
          await GithubSyncHandler.promises.deleteBranchOnGitHub(
            projectStatus.repo,
            branchName,
            userId
          )

        } catch (err) {
          // update merge_status to failure, and save the unmerged_branch
          await GithubSyncHandler.promises.updateProjectGitHubSyncStatus(projectId, {
            merge_status: 'failure',
            unmerged_branch: branchName,
          })

          logger.error('Failed to merge branch to default branch', { err })
          return res.status(500).json({
            error: 'Failed to merge changes to GitHub, please resolve the conflict on GitHub and try again'
          })
        }

      } else if (latestVersion === last_sync_version) {
        // newSha will be the latest sha in default branch
        newSha = await GithubSyncHandler.promises.getBranchHeadCommitSha(
          projectStatus.repo,
          projectStatus.default_branch,
          userId
        )

      }

    } else if (projectStatus.merge_status === 'failure') {
      // If the last merge failed, we try to re-merge the unmerged branch
      const unmergedBranch = projectStatus.unmerged_branch
      if (!unmergedBranch) {
        return res.status(500).json({ error: 'Unmerged branch info is missing.' })
      }

      try {
        // const mergeResult = await GithubSyncHandler.promises.mergeBranchToDefaultBranch(
        //   projectStatus.repo,
        //   unmergedBranch,
        //   projectStatus.default_branch,
        //   userId
        // )
        const diff = await GithubSyncHandler.promises.diffBranchsOnGitHub(
          projectStatus.repo,
          projectStatus.default_branch,
          unmergedBranch,
          userId
        )

        if (diff.length === 0) {
          newSha = await GithubSyncHandler.promises.getBranchHeadCommitSha(
            projectStatus.repo,
            projectStatus.default_branch,
            userId
          )
        } else {
          return res.status(500).json({ error: 'There are still conflicts between unmerged branch and default branch, please resolve the conflict on GitHub and try again' })
        }
      } catch (err) {
        await GithubSyncHandler.promises.updateProjectGitHubSyncStatus(
          projectId,
          {
            merge_status: 'failure',
            unmerged_branch: unmergedBranch, // keep the same unmerged branch
          }
        )
        logger.error('Failed to re-merge unmerged branch', { err })
        return res.status(500).json({
          error: 'Failed to re-merge changes to GitHub, please resolve the conflict on GitHub and try again'
        })
      }
    }

    // now we have the new sha after merge.
    // Step 3, we need to compare the new sha with last_sync_sha, if they are different, we need to push the changes back to overleaf.
    if (newSha && newSha != ""
      && newSha !== projectStatus.last_sync_sha) {
      // list the differences between newSha and last_sync_sha on GitHub
      const diff = await GithubSyncHandler.promises.diffChangesOnGitHub(
        projectStatus.repo,
        projectStatus.default_branch,
        projectStatus.last_sync_sha,
        newSha,
        userId
      )

      const tree = await GithubSyncHandler.promises.getFileTreeOnCommit(
        projectStatus.repo,
        newSha,
        userId
      )

      let resp = GithubSyncHandler.generateRespURL(diff, tree, projectStatus.repo, newSha)

      return res.json(
        {
          files: resp,
          newSha: newSha
        }
      )
    } else {
      // no changes, just return ok
      return res.status(200).json({ message: 'Already up to date, no changes to sync' })
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
  // Never reach here, but just in case
  return res.status(200).json({ message: 'Merge to GitHub and push back process completed' })
}

export default {
  exportProjectToGithub: expressify(exportProjectToGithub),
  mergeToGitHubAndPushback: expressify(mergeToGitHubAndPushback),
}