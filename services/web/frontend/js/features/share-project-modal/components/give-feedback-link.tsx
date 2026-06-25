import { useTranslation } from 'react-i18next'
import OLButton from '@/shared/components/ol/ol-button'
import getMeta from '@/utils/meta'

export default function GiveFeedbackLink() {
  const { t } = useTranslation()
  const isProfessionalGroupPlan = getMeta('ol-user')?.isProfessionalGroupPlan

  const link = isProfessionalGroupPlan
    ? 'https://forms.gle/rz1JDMuNajWG4ZY49'
    : 'https://forms.gle/WLEjzG4Ayp8zFscM9'

  return (
    <OLButton
      variant="link"
      size="sm"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fw-bold"
    >
      {t('give_feedback')}
    </OLButton>
  )
}
