import OLTooltip from '@/shared/components/ol/ol-tooltip'
import { formatDate, fromNowDate } from '@/utils/dates'
import { User } from '../../../../../../types/user/api'

type DeletedAtProps = {
  user: User
}

export default function deletedAtCell({ user }: deletedAtCellProps) {
  const deletedAt = user.deletedAt ? fromNowDate(user.deletedAt) : 'Not deleted'
  const tooltipText = user.deletedAt ? formatDate(user.deletedAt) : 'Not deleted'
  return (
    <OLTooltip
      key={`tooltip-deleted-at-${user.id}`}
      id={`tooltip-deleted-at-${user.id}`}
      description={tooltipText}
      overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
    >
      <span>{deletedAt}</span>
    </OLTooltip>
  )
}
