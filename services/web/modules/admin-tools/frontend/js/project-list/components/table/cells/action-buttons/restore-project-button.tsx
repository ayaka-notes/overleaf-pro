import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useProjectListContext } from '../../../../context/project-list-context'
import { Project } from '../../../../../../../types/project/api'
import RestoreProjectModal from '../../../modals/restore-project-modal'
import { undeleteProject } from '../../../../util/api'

type RestoreProjectButtonProps = {
  project: Project
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function RestoreProjectButton({
  project,
  children,
}: RestoreProjectButtonProps) {
  const { toggleSelectedProject, updateProjectViewData } =
    useProjectListContext()
  const { t } = useTranslation()
  const text = t('restore')
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

  const handleRestoreProject = useCallback(() => {
//    const ownerId = project.owner ?? getMeta('ol-user_id')
    return undeleteProject(project.id, project.owner).then(data => {
      toggleSelectedProject(project.id, false)
      updateProjectViewData({
        ...project,
        ...data,
        deleted: false,
        trashed: false,
      })
    })
  }, [project, toggleSelectedProject, updateProjectViewData])

  if (!project.deleted) return null

  return (
    <>
      {children(text, handleOpenModal)}
      <RestoreProjectModal
        projects={[project]}
        actionHandler={handleRestoreProject}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const RestoreProjectButtonTooltip = memo(function RestoreProjectButtonTooltip({
  project,
}: Pick<RestoreProjectButtonProps, 'project'>) {
  return (
    <RestoreProjectButton project={project}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-restore-project-${project.id}`}
          id={`restore-project-${project.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="restore"
          />
        </OLTooltip>
      )}
    </RestoreProjectButton>
  )
})

export default memo(RestoreProjectButton)
export { RestoreProjectButtonTooltip }
