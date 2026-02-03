import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useProjectListContext } from '../../../../context/project-list-context'
import { Project } from '../../../../../../../types/project/api'
import TransferProjectModal from '../../../modals/transfer-project-modal'
import { TransferOwnershipOptions, transferProjectOwnership } from '../../../../util/api'

type TransferProjectButtonProps = {
  project: Project
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function TransferProjectButton({ project, children }: TransferProjectButtonProps) {

  if (project.deleted) return null

  const { 
    removeProjectFromView, 
    updateProjectViewData, 
    toggleSelectedProject, 
    projectsOwnerId } 
  = useProjectListContext()
  const { t } = useTranslation()
  const text = t('change_owner')
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

  const handleTransferProject = useCallback(async (project: Project, options: TransferOwnershipOptions ) => {
    await transferProjectOwnership(project.id, options)
    if (!projectsOwnerId) {
      updateProjectViewData({
        ...project,
        owner: options.user_id,
      })
      toggleSelectedProject(project.id, false)
    } else {
      removeProjectFromView(project)
    }
  }, [project, removeProjectFromView, updateProjectViewData])

  return (
    <>
      {children(text, handleOpenModal)}
      <TransferProjectModal
        projects={[project]}
        actionHandler={handleTransferProject}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const TransferProjectButtonTooltip = memo(function TransferProjectButtonTooltip({
  project,
}: Pick<TransferProjectButtonProps, 'project'>) {
  return (
    <TransferProjectButton project={project}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-transfer-project-${project.id}`}
          id={`trnsfer-project-${project.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="swap_horiz"
          />
        </OLTooltip>
      )}
    </TransferProjectButton>
  )
})

export default memo(TransferProjectButton)
export { TransferProjectButtonTooltip }
