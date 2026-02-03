import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Project } from '../../../../../../../types/project/api'
import TrashProjectModal from '../../../modals/trash-project-modal'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useProjectListContext } from '../../../../context/project-list-context'
import { trashProjectForUser } from '../../../../util/api'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'

type TrashProjectButtonProps = {
  project: Project
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function TrashProjectButton({ project, children }: TrashProjectButtonProps) {

  if (project.trashed || project.deleted ) return null

  const { toggleSelectedProject, updateProjectViewData } =
    useProjectListContext()
  const { t } = useTranslation()
  const text = t('trash')
  const [showModal, setShowModal] = useState(false)
  const isMounted = useIsMounted()

  const handleOpenModal = useCallback(() => {
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    if (isMounted.current) {
      setShowModal(false)
    }
  }, [isMounted])

  const handleTrashProject = useCallback(async () => {
    await trashProjectForUser(project.id, project.owner)
    toggleSelectedProject(project.id, false)
    updateProjectViewData({
      ...project,
      trashed: true,
      archived: false,
    })
  }, [project, toggleSelectedProject, updateProjectViewData])

  return (
    <>
      {children(text, handleOpenModal)}
      <TrashProjectModal
        projects={[project]}
        actionHandler={handleTrashProject}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const TrashProjectButtonTooltip = memo(function TrashProjectButtonTooltip({
  project,
}: Pick<TrashProjectButtonProps, 'project'>) {
  return (
    <TrashProjectButton project={project}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-trash-project-${project.id}`}
          id={`trash-project-${project.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="delete"
          />
        </OLTooltip>
      )}
    </TrashProjectButton>
  )
})

export default memo(TrashProjectButton)
export { TrashProjectButtonTooltip }
