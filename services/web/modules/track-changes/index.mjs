import TrackChangesRouter from './app/src/TrackChangesRouter.mjs'
import ProjectEditorHandler from '../../app/src/Features/Project/ProjectEditorHandler.mjs'

ProjectEditorHandler.trackChangesAvailable = true
const TrackChangesModule = { router: TrackChangesRouter }
export default TrackChangesModule
