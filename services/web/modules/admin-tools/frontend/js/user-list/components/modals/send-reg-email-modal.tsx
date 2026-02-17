import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import UsersActionModal from './users-action-modal'
import UsersList from './users-list'
import { useUserListContext } from '../../context/user-list-context'

type SendRegEmailModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function SendRegEmailModal({
  users,
  actionHandler,
  showModal,
  handleCloseModal,
}: SendRegEmailModalProps) {
  const { t } = useTranslation()
  const { selectedUsers, toggleSelectedUser } = useUserListContext()

  const localUsers = useMemo(
    () => users.filter(user => user.authMethods?.includes('local') && !user.suspended),
    [users]
  )

  const [usersToDisplay, setUsersToDisplay] = useState<typeof users>([])

  useEffect(() => {
    if (!showModal) return

    selectedUsers.forEach(user => {
      if (!user.authMethods?.includes('local') || user.suspended) {
        toggleSelectedUser(user.id, false)
      }
    })
    // intentionally depends only on showModal
  }, [showModal])

  useEffect(() => {
    if (showModal) {
      setUsersToDisplay(displayUsers => {
        return displayUsers.length ? displayUsers : localUsers
      })
    } else {
      setUsersToDisplay([])
    }
  }, [showModal, localUsers])

  return (
    <UsersActionModal
      action="resend"
      actionHandler={actionHandler}
      title={'Resend activation email'}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={localUsers}
    >
      <p>{"About to resend activation email for the following users:"}</p>
      <UsersList users={localUsers} usersToDisplay={usersToDisplay} />
    </UsersActionModal>
  )
}

export default SendRegEmailModal

