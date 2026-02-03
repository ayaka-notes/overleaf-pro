import { useState } from 'react'
import OLButton from '@/shared/components/ol/ol-button'
import { useTranslation } from 'react-i18next'
import PurgeProjectModal from '../../../modals/purge-project-modal'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useProjectListContext } from '../../../../context/project-list-context'
import { purgeProject } from '../../../../util/api'
import { Project } from '../../../../../../../types/project/api'

function PurgeProjectsButton() {
  const { t } = useTranslation()
  const {
    selectedProjects,
    removeProjectFromView
  } = useProjectListContext()
  const [showModal, setShowModal] = useState(false)
  const isMounted = useIsMounted()

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (isMounted.current) {
      setShowModal(false)
    }
  }

  const handlePurgeProject = async (project: Project) => {
    await purgeProject(project.id)
    removeProjectFromView(project)
  }

  return (
    <>
      <OLButton variant="danger" onClick={handleOpenModal}>
        {t('purge')}
      </OLButton>
      <PurgeProjectModal
        projects={selectedProjects}
        actionHandler={handlePurgeProject}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

export default PurgeProjectsButton
