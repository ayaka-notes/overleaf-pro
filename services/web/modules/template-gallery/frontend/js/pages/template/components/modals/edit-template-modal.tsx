import React, { useReducer, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import OLForm from '@/shared/components/ol/ol-form'
import OLButton from '@/shared/components/ol/ol-button'
import withErrorBoundary from '@/infrastructure/error-boundary'
import TemplateActionModal from './template-action-modal'
import { useTemplateContext } from '../../context/template-context'
import TemplateFormFields from '../form/template-form-fields'
import type { Template } from '../../../types/template'

type EditTemplateModalProps = {
  showModal: boolean
  handleCloseModal: () => void
  actionHandler: (editedTemplate: Template) => void | Promise<void>
}

type ActionError = {
  info?: {
    statusCode?: number
  }
}

type TemplateFormAction =
  | { type: 'UPDATE'; payload: Partial<Template> }
  | { type: 'RESET'; payload: Template }
  | { type: 'CLEAR_FIELD'; field: keyof Template }

function templateFormReducer(state: Template, action: TemplateFormAction): Template {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, ...action.payload }
    case 'RESET':
      return { ...action.payload }
    case 'CLEAR_FIELD':
      return { ...state, [action.field]: '' }
    default:
      return state
  }
}

function EditTemplateModal({
  showModal,
  handleCloseModal,
  actionHandler,
}: EditTemplateModalProps) {
  const { t } = useTranslation()
  const { template } = useTemplateContext()

  const [editedTemplate, dispatch] = useReducer(templateFormReducer, template)
  const [actionError, setActionError] = useState<ActionError | null>(null)
  const clearModalErrorRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (showModal) {
      dispatch({ type: 'RESET', payload: template })
      setActionError(null)
    }
  }, [showModal, template])

  const isConflictError = useMemo(
    () => actionError?.info?.statusCode === 409,
    [actionError]
  )

  const valid = useMemo(
    () => editedTemplate.name.trim().length > 0,
    [editedTemplate.name]
  )

  const handleChange = useCallback(
    (changes: Partial<Template>) => {
      dispatch({ type: 'UPDATE', payload: changes })
      if ('name' in changes && isConflictError) {
        setActionError(null)
        clearModalErrorRef.current?.()
      }
    },
    [isConflictError]
  )

  const handleEnterKey = useCallback(() => {
    document.getElementById('submit-edit-template')?.click()
  }, [])

  const handleAction = useCallback(() => {
    return Promise.resolve(actionHandler(editedTemplate)).catch(err => {
      setActionError(err)
      throw err
    })
  }, [actionHandler, editedTemplate])

  const submitButtonDisabled = !valid || isConflictError

  return (
    <TemplateActionModal
      action="edit"
      title={"Edit template"}
      template={editedTemplate}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      size="lg"
      actionHandler={handleAction}
      renderFooterButtons={({ onConfirm, onCancel, isProcessing }) => (
        <>
          <OLButton variant="secondary" onClick={onCancel}>
            {t('cancel')}
          </OLButton>
          <OLButton
            id="submit-edit-template"
            onClick={onConfirm}
            variant="primary"
            disabled={submitButtonDisabled || isProcessing}
          >
            {t('save')}
          </OLButton>
        </>
      )}
      onClearError={fn => {
        clearModalErrorRef.current = fn
      }}
    >
      <div className="modal-body-publish">
        <div className="content-as-table">
          <OLForm onSubmit={e => e.preventDefault()}>
            <TemplateFormFields
              template={editedTemplate}
              includeLanguage
              onChange={handleChange}
              onEnterKey={handleEnterKey}
            />
          </OLForm>
        </div>
      </div>
    </TemplateActionModal>
  )
}

export default withErrorBoundary(React.memo(EditTemplateModal))
