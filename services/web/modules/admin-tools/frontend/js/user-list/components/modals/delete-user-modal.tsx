import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import UsersActionModal from './users-action-modal'
import UsersList from './users-list'
import Notification from '@/shared/components/notification'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormCheckbox from '@/shared/components/ol/ol-form-checkbox'
import OLForm from '@/shared/components/ol/ol-form'
import SelectOwnerForm from '../../../project-list/components/select-owner-form'
import { useUserListContext } from '../../../user-list/context/user-list-context'
import { UserRef } from '../../../../../types/project/api'
import sortUsers from '../../../user-list/util/sort-users'

type DeleteUserModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>

function DeleteUserModal({
  users,
  actionHandler,
  showModal,
  handleCloseModal,
}: DeleteUserModalProps) {
  const { t } = useTranslation()
  const { loadedUsers } = useUserListContext()

  const [usersToDisplay, setUsersToDisplay] = useState<typeof users>([])
  const [sendEmail, setSendEmail] = useState<boolean>(false)
  const [transferProjects, setTransferProjects] = useState<boolean>(false)
  const [newOwner, setNewOwner] = useState<UserRef | null>(null)

  const selectOwnerInputRef = useRef<HTMLInputElement>(null)

  const potentialOwners = useMemo(() => {
    if (!loadedUsers) return []

    const excludeIds = new Set(users.map(u => u.id))
    const possibleUsers = loadedUsers.filter(
      user => !user.deleted && !excludeIds.has(user.id)
    )
    return sortUsers(possibleUsers, { by: 'name', order: 'asc' })
  }, [loadedUsers, users])

  useEffect(() => {
    if (showModal) {
      setUsersToDisplay(displayUsers => displayUsers.length ? displayUsers : users)
      setSendEmail(false)
      setTransferProjects(false)
      setNewOwner(null)
    } else {
      setUsersToDisplay([])
    }
  }, [showModal, users])

  useEffect(() => {
    if (transferProjects) {
      selectOwnerInputRef.current?.focus()
    }
  }, [transferProjects])

  const handleSendEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendEmail(e.currentTarget.checked)
  }

  const handleTransferProjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransferProjects(e.currentTarget.checked)
    if (!e.currentTarget.checked) {
      setNewOwner(null)
    }
  }

  const options = useMemo(() => {
    return {
      sendEmail,
      toUserId: transferProjects && newOwner ? newOwner.id : null,
    }
  }, [sendEmail, transferProjects, newOwner])

  return (
    <UsersActionModal
      action="delete"
      actionHandler={actionHandler}
      title={t('delete_account')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
      options={options}
      actionIsDisabled={transferProjects && !newOwner}
    >
      <p>
        You are about to delete the following user.
      </p>
      <UsersList users={users} usersToDisplay={usersToDisplay} />
      <Notification
        content={t('this_action_cannot_be_undone')}
        type="warning"
      />

      <OLForm className="mt-4">
        <OLFormGroup controlId="send-email-checkbox" className="d-flex">
          <OLFormCheckbox
            autoComplete="off"
            onChange={handleSendEmailChange}
            name="sendEmail"
            label={'Notify users about account deletion'}
            checked={sendEmail}
            area-label={'Notify users about account deletion'}
          />
        </OLFormGroup>

        <OLFormGroup controlId="transfer-projects-checkbox" className="mt-3">
          <OLFormCheckbox
            autoComplete="off"
            onChange={handleTransferProjectsChange}
            name="transferProjects"
            label={t('transfer_this_users_projects')}
            checked={transferProjects}
            area-label={t('transfer_this_users_projects')}
          />
        </OLFormGroup>

        {transferProjects && (
          <OLFormGroup className="mt-2">
            <SelectOwnerForm
              ref={selectOwnerInputRef}
              loading={!potentialOwners.length}
              users={potentialOwners}
              value={newOwner}
              onChange={setNewOwner}
            />
          </OLFormGroup>
        )}
      </OLForm>
    </UsersActionModal>
  )
}

export default DeleteUserModal

