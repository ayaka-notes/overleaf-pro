import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ProjectsActionModal from './projects-action-modal'
import ProjectsList from './projects-list'

type RestoreProjectModalProps = Pick<
  React.ComponentProps<typeof ProjectsActionModal>,
  'projects' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function RestoreProjectModal({
  projects,
  actionHandler,
  showModal,
  handleCloseModal,
}: RestoreProjectModalProps) {
  const { t } = useTranslation()
  const [projectsToDisplay, setProjectsToDisplay] = useState<typeof projects>(
    []
  )

  useEffect(() => {
    if (showModal) {
      setProjectsToDisplay(displayProjects => {
        return displayProjects.length ? displayProjects : projects
      })
    } else {
      setProjectsToDisplay([])
    }
  }, [showModal, projects])

  return (
    <ProjectsActionModal
      action="restore"
      actionHandler={actionHandler}
      title={t('restore_projects')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      projects={projects}
    >
      <p>{t('about_to_restore_projects')}</p>
      <ProjectsList projects={projects} projectsToDisplay={projectsToDisplay} />
    </ProjectsActionModal>
  )
}

export default RestoreProjectModal
