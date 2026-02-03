import { Project } from '../../../../../../types/project/api'
import { DownloadProjectButtonTooltip } from './action-buttons/download-project-button'
import { TransferProjectButtonTooltip } from './action-buttons/transfer-project-button'
import { TrashProjectButtonTooltip } from './action-buttons/trash-project-button'
import { UntrashProjectButtonTooltip } from './action-buttons/untrash-project-button'
import { DeleteProjectButtonTooltip } from './action-buttons/delete-project-button'
import { RestoreProjectButtonTooltip } from './action-buttons/restore-project-button'
import { PurgeProjectButtonTooltip } from './action-buttons/purge-project-button'

type ActionsCellProps = {
  project: Project
}

export default function ActionsCell({ project }: ActionsCellProps) {
  return (
    <>
      <DownloadProjectButtonTooltip project={project} />
      <TransferProjectButtonTooltip project={project} />
      <TrashProjectButtonTooltip project={project} />
      <UntrashProjectButtonTooltip project={project} />
      <DeleteProjectButtonTooltip project={project} />
      <RestoreProjectButtonTooltip project={project} />
      <PurgeProjectButtonTooltip project={project} />
    </>
  )
}
