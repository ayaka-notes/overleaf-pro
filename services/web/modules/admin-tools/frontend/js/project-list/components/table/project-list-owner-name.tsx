import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const ProjectListOwnerName = memo<{ ownerName: string }>(
  ({ ownerName }) => {
    const { t } = useTranslation()
    return <span translate="no"> — {t('owned_by_x', { x: ownerName })}</span>
  }
)
ProjectListOwnerName.displayName = 'ProjectListOwnerName'
