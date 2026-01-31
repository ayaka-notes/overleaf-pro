import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { debugConsole } from '@/utils/debugging'
import { getJSON, postJSON } from '@/infrastructure/fetch-json'
import Notification from '@/shared/components/notification'
import {
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
} from '@/shared/components/ol/ol-modal'
import OLForm from '@/shared/components/ol/ol-form'
import OLButton from '@/shared/components/ol/ol-button'
import { useDetachCompileContext } from '@/shared/context/detach-compile-context'
import { useUserContext } from '@/shared/context/user-context'
import { useFocusTrap } from '../../hooks/use-focus-trap'
import TemplateFormFields from '../form/template-form-fields'
import type { Template } from '../../../types/template'


interface ManageTemplateModalContentProps {
  handleHide: () => void
  inFlight: boolean
  setInFlight: (inFlight: boolean) => void
  handleAfterPublished: (data: Template) => void
  projectId: string
  projectName: string
}

export default function ManageTemplateModalContent({
  handleHide,
  inFlight,
  setInFlight,
  handleAfterPublished,
  projectId,
  projectName,
}: ManageTemplateModalContentProps) {
  const { t } = useTranslation()
  const { pdfFile } = useDetachCompileContext()
  const user = useUserContext()

  const [template, setTemplate] = useState<Partial<Template>>({
    name: projectName,
    authorMD: `${user.first_name} ${user.last_name}`.trim(),
  })
  const [override, setOverride] = useState(false)
  const [titleConflict, setTitleConflict] = useState(false)
  const [error, setError] = useState<string | false>(false)
  const [notificationType, setNotificationType] = useState<'error' | 'warning'>('error')
  const [disablePublish, setDisablePublish] = useState(false)

  // Only the trimmed name gates submission
  const valid = (template.name ?? '').trim()

  useEffect(() => {
    const queryParams = new URLSearchParams({ key: 'name', val: projectName })
    getJSON(`/api/template?${queryParams}`)
      .then((data) => {
        if (!data) return
        setTemplate(prev => ({
          ...prev,
          descriptionMD: data.descriptionMD,
          authorMD: data.authorMD,
          license: data.license,
          category: data.category,
        }))
      })
      .catch(debugConsole.error)
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!valid) return

    setError(false)
    setInFlight(true)

    postJSON(`/template/new/${projectId}`, {
      body: {
        category: template.category,
        name: valid,
        authorMD: (template.authorMD ?? '').trim(),
        license: template.license,
        descriptionMD: (template.descriptionMD ?? '').trim(),
        build: pdfFile.build,
        override,
      },
    })
      .then(data => {
        handleHide()
        handleAfterPublished(data)
      })
      .catch(({ response, data }) => {
        if (response?.status === 409 && data.canOverride) {
          setNotificationType('warning')
          setOverride(true)
        } else {
          setNotificationType('error')
          setDisablePublish(true)
        }
        setError(data.message)
        if (response?.status === 409) setTitleConflict(true)
      })
      .finally(() => {
        setInFlight(false)
      })
  }

  const handleChange = (changes: Partial<Template>) => {
    if ('name' in changes && titleConflict) {
      setError(false)
      setOverride(false)
      if (disablePublish) setDisablePublish(false)
    }
    setTemplate(prev => ({ ...prev, ...changes }))
  }

  const handleEnterKey = () => {
    document.getElementById('submit-publish-template')?.click()
  }

  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef)

  return (
    <div ref={modalRef}>
      <OLModalHeader>
        <OLModalTitle>{t('publish_as_template')}</OLModalTitle>
      </OLModalHeader>

      <OLModalBody>
        <div className="modal-body-publish">
          <div className="content-as-table">
            <OLForm id="publish-template-form" onSubmit={handleSubmit}>
              <TemplateFormFields
                template={template}
                includeLanguage={false}
                onChange={handleChange}
                onEnterKey={handleEnterKey}
              />
            </OLForm>
          </div>
        </div>
        {error && (
          <Notification
            content={error.length ? error : t('generic_something_went_wrong')}
            type={notificationType}
          />
        )}
      </OLModalBody>

      <OLModalFooter>
        <OLButton variant="secondary" disabled={inFlight} onClick={handleHide}>
          {t('cancel')}
        </OLButton>
        <OLButton
          id="submit-publish-template"
          variant={override ? 'danger' : 'primary'}
          disabled={inFlight || !valid || disablePublish}
          form="publish-template-form"
          type="submit"
        >
          {inFlight ? <>{t('publishing')}…</> : override ? t('overwrite') : t('publish')}
        </OLButton>
      </OLModalFooter>
    </div>
  )
}
