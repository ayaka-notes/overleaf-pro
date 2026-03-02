# GitHub Sync Service

Overleaf Github Sync Service, @Ayaka-notes.

## Service Overview
This service is only responsible for 2 things:
- export existing Overleaf projects to GitHub repositories
- export existing overleaf changes and merge changes from GitHub repositories to Overleaf projects

## How we do sync bewtween Overleaf and GitHub
We use `sync point` to track the last synced commit in GitHub and the last synced version in Overleaf, which is stored in the mongodb. A `sync point` means a version in overleaf and a commit in github, they are totally the same content.

When we do sync, we will first check the last overleaf version and current overleaf version, if they are different, we will export the changes from overleaf to github, **as a branch**, we call it `overleaf branch` in the later.

Then we will try to merge this branch to the default branch. However, in GitHub, there are 2 kinds of merge:
- fast forward merge: if there is no new commit in the default branch, we can directly merge the branch to the default branch, and update the sync point.
- normal merge: if there are new commits in the default branch, we need to create a merge commit to merge the branch to the default branch, and update the sync point.

Now we have the new commits in the default branch (called newSha in the code), we will try to merge the new commits to overleaf.

Since GitHub stored all the files in the repository, we can get the changed files between the last synced commit and the new commit, we only return changes files with URLs, then web service will download the changed files and update the overleaf project.

## What if there are conflicts?
If there are conflicts, we will not merge the branch to the default branch, and we will return error to the web service, then web service will get sync status and show the conflict to the user, and ask the user to resolve the conflict in GitHub. 

If user merge that conflict branch to the default branch, then we will update the sync point and merge the changes to overleaf.

> How we detect if a branch is merged to the default branch?
>
> We will use GitHub API to diff the default branch and the `overleaf branch`, if the default falls behind the branch, it means the branch is not merged, if the default branch is ahead of the branch, it means the branch is merged.
>
> In a corner case, if the overleaf branch is merged but deleted, we will use the latest commit in the default branch as the new sync point, and merge the changes to overleaf.


## Copyright
Copyright (C) 2026 Ayaka-notes.