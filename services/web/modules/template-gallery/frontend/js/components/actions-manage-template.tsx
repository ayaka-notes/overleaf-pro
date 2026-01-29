import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as eventTracking from '@/infrastructure/event-tracking'
import getMeta from '@/utils/meta'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import { useDetachCompileContext } from '@/shared/context/detach-compile-context'
import EditorManageTemplateModalWrapper from '../pages/template/components/manage-template-modal/editor-manage-template-modal-wrapper'
import LeftMenuButton from '@/features/editor-left-menu/components/left-menu-button'

type TemplateManageResponse = {
  template_id: string
}

export default function ActionsManageTemplate() {

  const templatesAdmin = getMeta('ol-showTemplatesServerPro')
  if (!templatesAdmin) {
    return null
  }

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

  return (
    <>
      {pdfFile ? (
        <LeftMenuButton onClick={handleShowModal} icon='open_in_new'>
          {t('publish_as_template')}
        </LeftMenuButton>
      ) : (
        <OLTooltip
          id="disabled-publish-as-template"
          description={t('please_compile_pdf_before_publish_as_template')}
          overlayProps={{
            placement: 'top',
          }}
        >
          {/* OverlayTrigger won't fire unless the child is a non-react html element (e.g div, span) */}
          <div>
            <LeftMenuButton
              icon='open_in_new'
              disabled
              disabledAccesibilityText={t(
                'please_compile_pdf_before_publish_as_template'
              )}
            >
              {t('publish_as_template')}
            </LeftMenuButton>
          </div>
        </OLTooltip>
      )}
      <EditorManageTemplateModalWrapper
        show={showModal}
        handleHide={() => setShowModal(false)}
        openTemplate={openTemplate}
      />
    </>
  )
}
