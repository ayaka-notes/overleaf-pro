import { useState } from 'react'
import OLButton from '@/shared/components/ol/ol-button'
import { useTranslation } from 'react-i18next'
import DeleteProjectModal from '../../../modals/delete-project-modal'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useProjectListContext } from '../../../../context/project-list-context'
import { deleteProject } from '../../../../util/api'
import { Project } from '../../../../../../../types/project/api'

function DeleteProjectsButton() {
  const { t } = useTranslation()
  const {
    selectedProjects,
    toggleSelectedProject,
    updateProjectViewData,
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

  const handleDeleteProject = async (project: Project) => {
    await deleteProject(project.id)
    toggleSelectedProject(project.id, false)
    updateProjectViewData({
      ...project,
      deleted: true,
    })
  }

  return (
    <>
      <OLButton variant="danger" onClick={handleOpenModal}>
        {t('delete')}
      </OLButton>
      <DeleteProjectModal
        projects={selectedProjects}
        actionHandler={handleDeleteProject}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

export default DeleteProjectsButton
