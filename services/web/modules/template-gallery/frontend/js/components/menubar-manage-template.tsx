import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as eventTracking from '@/infrastructure/event-tracking'
import getMeta from '@/utils/meta'
import { useDetachCompileContext } from '@/shared/context/detach-compile-context'
import { useCommandProvider } from '@/features/ide-react/hooks/use-command-provider'
import EditorManageTemplateModalWrapper from '../pages/template/components/manage-template-modal/editor-manage-template-modal-wrapper'

type TemplateManageResponse = {
  template_id: string
}

export default function MenubarManageTemplate() {
  const templatesAdmin = getMeta('ol-showTemplatesServerPro')
  const [showModal, setShowModal] = useState(false)
  const { pdfFile } = useDetachCompileContext()
  const { t } = useTranslation()

  const handleShowModal = useCallback(() => {
    eventTracking.sendMB('left-menu-template')
    setShowModal(true)
  }, [])

  const openTemplate = useCallback(
    ({ template_id: templateId }: TemplateManageResponse) => {
      location.assign(`/template/${templateId}`)
    },
    [location]
  )

  useCommandProvider(
    () =>
      templatesAdmin
        ? [
            {
              id: 'manage-template',
              label: t('publish_as_template'),
              disabled: !pdfFile,
              handler: handleShowModal,
            },
          ]
        : [],
    [t, templatesAdmin, pdfFile, handleShowModal]
  )

  if (!templatesAdmin) {
    return null
  }

  return (
    <EditorManageTemplateModalWrapper
      show={showModal}
      handleHide={() => setShowModal(false)}
      openTemplate={openTemplate}
    />
  )
}
