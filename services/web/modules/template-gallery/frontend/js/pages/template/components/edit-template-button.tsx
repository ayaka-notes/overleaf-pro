import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import OLButton from '@/shared/components/ol/ol-button'
import EditTemplateModal from './modals/edit-template-modal'
import { useTemplateContext } from '../context/template-context'
import { updateTemplate } from '../util/api'
import type { Template } from '../../types/template'

export default function EditTemplateButton() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const isMounted = useIsMounted()
  const { template, setTemplate } = useTemplateContext()

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (isMounted.current) {
      setShowModal(false)
    }
  }

  const handleEditTemplate = async (editedTemplate: Template) => {
    const updated = await updateTemplate({ editedTemplate, template })
    if (updated) {
      setTemplate(prev => ({ ...prev, ...updated }))
    }
  }

  return (
    <>
      <OLButton variant="secondary" onClick={handleOpenModal}>
        {t('edit')}
      </OLButton>

      <EditTemplateModal
        showModal={showModal}
        handleCloseModal={handleCloseModal}
        actionHandler={handleEditTemplate}
      />
    </>
  )
}
