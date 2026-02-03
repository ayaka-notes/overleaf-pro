import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import UsersActionModal from './users-action-modal'
import UsersList from './users-list'
import Notification from '@/shared/components/notification'

type PurgeUserModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function PurgeUserModal({
  users,
  actionHandler,
  showModal,
  handleCloseModal,
}: PurgeUserModalProps) {
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
      action="purge"
      actionHandler={actionHandler}
      title={t('permanently_delete_accounts')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
    >
      <p>{t('about_to_permanently_delete_accounts')}</p>
      <UsersList users={users} usersToDisplay={usersToDisplay} />
      <Notification
        content={t('this_action_cannot_be_undone')}
        type="warning"
      />
    </UsersActionModal>
  )
}

export default PurgeUserModal
