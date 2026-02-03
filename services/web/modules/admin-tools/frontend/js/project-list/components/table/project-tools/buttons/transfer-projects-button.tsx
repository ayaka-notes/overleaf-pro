import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import TransferProjectModal from '../../../modals/transfer-project-modal'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useProjectListContext } from '../../../../context/project-list-context'
import { TransferOwnershipOptions, transferProjectOwnership } from '../../../../util/api'
import { Project } from '../../../../../../../types/project/api'

function TransferProjectsButton() {
  const { 
    selectedProjects,
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

  const handleTransferProject = async (project: Project, options: TransferOwnershipOptions ) => {
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
  }

  return (
    <>
      <OLTooltip
        id="tooltip-transfer-projects"
        description={text}
        overlayProps={{ placement: 'bottom', trigger: ['hover', 'focus'] }}
      >
        <OLIconButton
          onClick={handleOpenModal}
          variant="secondary"
          accessibilityLabel={text}
          icon="swap_horiz"
        />
      </OLTooltip>
      <TransferProjectModal
        projects={selectedProjects}
        actionHandler={handleTransferProject}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

export default memo(TransferProjectsButton)
