import mongoose from "../../../../app/src/infrastructure/Mongoose.mjs"

const { Schema } = mongoose
const { ObjectId } = Schema

export const GitHubSyncProjectStatesSchema = new Schema(
  {
    // the project we sync to github
    projectId: { type: ObjectId, ref: 'Project', required: true, unique: true },
    // the user who syncs the project to github
    // may not be the project owner, but must have write access to the project
    // he can connect the project to github, and do sync operation.
    ownerId: { type: ObjectId, ref: 'User', required: true },
    // the repo we sync to, in format "owner/repoName"
    repo: { type: String, required: true },
    // if last merge is success
    merge_status: { type: String, enum: ['success', 'failure', 'pending'], default: 'pending' },
    // sync branch
    default_branch: { type: String, default: null },
    // if merge_status is failure, this field will be the branch name we pushed to.
    unmerged_branch: { type: String, default: null },
    // the sha of last commit we synced to github 
    last_sync_sha: { type: String, default: null },
    // the version in overleaf project when we do last sync.
    last_sync_version: { type: Number, default: null },
  },
  { collection: 'githubSyncProjectStates', minimize: false }
)

export const GitHubSyncProjectStates = mongoose.model(
  'GitHubSyncProjectStates',
  GitHubSyncProjectStatesSchema,
)