import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import { formatDate, fromNowDate } from '@/utils/dates'
import { User } from '../../../../../../types/user/api'

type LastActiveProps = {
  user: User
}

export default function lastActiveCell({ user }: LastActiveCellProps) {
  const { t } = useTranslation()
  const lastActiveDate = user.lastActive ? fromNowDate(user.lastActive) : t('never')
  const tooltipText = user.lastActive ? formatDate(user.lastActive) : t('never')
  return (
    <OLTooltip
      key={`tooltip-last-active-${user.id}`}
      id={`tooltip-last-active-${user.id}`}
      description={tooltipText}
      overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
    >
      <span>{lastActiveDate}</span>
    </OLTooltip>
  )
}
