import OLTooltip from '@/shared/components/ol/ol-tooltip'
import { formatDate, fromNowDate } from '@/utils/dates'
import { User } from '../../../../../../types/user/api'

type SignUpDateCellProps = {
  user: User
}

export default function signUpDateCell({ user }: SignUpDateCellProps) {
  const signUpDate = fromNowDate(user.signUpDate)
  const tooltipText = formatDate(user.signUpDate)
  return (
    <OLTooltip
      key={`tooltip-sign-up-date-${user.id}`}
      id={`tooltip-sign-up-date-${user.id}`}
      description={tooltipText}
      overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
    >
      <span>{signUpDate}</span>
    </OLTooltip>
  )
}
