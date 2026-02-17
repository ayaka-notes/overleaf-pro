import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import UsersActionModal from './users-action-modal'
import UsersList from './users-list'

type FlagUserModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'action' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function FlagUserModal({
  users,
  action,
  actionHandler,
  showModal,
  handleCloseModal,
}: FlagUserModalProps) {
  const { t } = useTranslation()
  const [usersToDisplay, setUsersToDisplay] = useState<typeof users>(
    []
  )

  useEffect(() => {
    if (showModal) {
      setUsersToDisplay(displayUsers => {
        return displayUsers.length ? displayUsers : users
      })
    } else {
      setUsersToDisplay([])
    }
  }, [showModal, users])

  let userData
  switch (action) {
    case 'set_admin':
      userData = { isAdmin: true }
      break
    case 'unset_admin':
      userData = { isAdmin: false }
      break
    case 'suspend':
      userData = { suspended: true }
      break
    case 'resume':
      userData = { suspended: false }
      break
    default:
      return
  }
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
return (
    <UsersActionModal
      action={action}
      actionHandler={actionHandler}
      title={capitalize(action) + " account"}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
      options={{userData}}
    >
      <p>About to {action} the following users:</p>
      <UsersList users={users} usersToDisplay={usersToDisplay} />
    </UsersActionModal>
  )
}

export default FlagUserModal
