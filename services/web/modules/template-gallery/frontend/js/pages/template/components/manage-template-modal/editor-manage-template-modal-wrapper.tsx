import React from 'react'
import withErrorBoundary from '@/infrastructure/error-boundary'
import { useProjectContext } from '@/shared/context/project-context'
import ManageTemplateModal from './manage-template-modal'
import type { Template } from '../../../types/template'

interface EditorManageTemplateModalWrapperProps {
  show: boolean
  handleHide: () => void
  openTemplate: (data: Template) => void
}

const EditorManageTemplateModalWrapper = React.memo(
  function EditorManageTemplateModalWrapper({ 
    show,
    handleHide,
    openTemplate,
  }: EditorManageTemplateModalWrapperProps) {
    const { project } = useProjectContext()

    if (!project) {
      // wait for useProjectContext
      return null
    }
    return (
      <ManageTemplateModal
        handleHide={handleHide}
        show={show}
        handleAfterPublished={openTemplate}
        projectId={project._id}
        projectName={project.name}
      />
    )
  }
)

export default withErrorBoundary(EditorManageTemplateModalWrapper)
