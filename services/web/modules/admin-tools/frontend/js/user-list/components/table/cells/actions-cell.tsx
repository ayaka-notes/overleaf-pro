import getMeta from '@/utils/meta'
import { DeleteUserButtonTooltip } from './action-buttons/delete-user-button'
import { RestoreUserButtonTooltip } from './action-buttons/restore-user-button'
import { PurgeUserButtonTooltip } from './action-buttons/purge-user-button'
import { FlagUserButtonTooltip } from './action-buttons/flag-user-button'
import { UpdateUserButtonTooltip } from './action-buttons/update-user-button'
import { ShowUserInfoButtonTooltip } from './action-buttons/show-user-info-button'
import { SendRegEmailButtonTooltip } from './action-buttons/send-reg-email-button'
import { User } from '../../../../../../types/user/api'

type ActionsCellProps = {
  user: User
}

export default function ActionsCell({ user }: ActionsCellProps) {
  const isSelf = getMeta('ol-user_id') === user.id
  return (
    <div className="d-flex flex-wrap justify-content-end">
      <span style={isSelf ? { visibility: 'hidden' } : undefined} >
        <SendRegEmailButtonTooltip user={user} />
      </span>
      <ShowUserInfoButtonTooltip user={user} />
      <UpdateUserButtonTooltip user={user} />
      <span style={isSelf ? { visibility: 'hidden' } : undefined} >
        <FlagUserButtonTooltip user={user} flag="suspended" />
      </span>
      <span style={isSelf ? { visibility: 'hidden' } : undefined} >
        <DeleteUserButtonTooltip user={user} />
        <RestoreUserButtonTooltip user={user} />
        <PurgeUserButtonTooltip user={user} />
      </span>
    </div>
  )
}
