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

return (
    <UsersActionModal
      action={action}
      actionHandler={actionHandler}
      title={t(`${action}_account`)}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
      options={{userData}}
    >
      <p>{t(`about_to_${action}_accounts`)}</p>
      <UsersList users={users} usersToDisplay={usersToDisplay} />
    </UsersActionModal>
  )
}

export default FlagUserModal
