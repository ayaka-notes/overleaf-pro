import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import UsersActionModal from './users-action-modal'
import UsersList from './users-list'

type RestoreUserModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function RestoreUserModal({
  users,
  actionHandler,
  showModal,
  handleCloseModal,
}: RestoreUserModalProps) {
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

  return (
    <UsersActionModal
      action="restore"
      actionHandler={actionHandler}
      title={t('restore_accounts')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
    >
      <p>{t('about_to_restore_accounts')}</p>
      <UsersList users={users} usersToDisplay={usersToDisplay} />
    </UsersActionModal>
  )
}

export default RestoreUserModal
