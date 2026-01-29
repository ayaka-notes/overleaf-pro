import { useTranslation } from 'react-i18next'
import withErrorBoundary from '@/infrastructure/error-boundary'
import Notification from '@/shared/components/notification'
import TemplateActionModal from './template-action-modal'

type DeleteTemplateModalProps = Pick<
  React.ComponentProps<typeof TemplateActionModal>,
  'template' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function DeleteTemplateModal({
  template,
  actionHandler,
  showModal,
  handleCloseModal,
}: DeleteTemplateModalProps) {
  const { t } = useTranslation()

  return (
    <TemplateActionModal
      action="delete"
      actionHandler={actionHandler}
      title={t('delete_template')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      template={template}
    >
      <p>{t('about_to_delete_template')}</p>
      <ul>
        <li key={`template-action-list-${template.id}`}>
          <b>{template.name}</b>
        </li>
      </ul>

      <Notification
        content={t('this_action_cannot_be_undone')}
        type="warning"
      />
    </TemplateActionModal>
  )
}

export default withErrorBoundary(DeleteTemplateModal)
