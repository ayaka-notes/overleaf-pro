import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import getMeta from '@/utils/meta'
import UsersActionModal from './users-action-modal'
import UsersList from './users-list'
import Notification from '@/shared/components/notification'
import OLForm from '@/shared/components/ol/ol-form'
import OLFormLabel from '@/shared/components/ol/ol-form-label'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormCheckbox from '@/shared/components/ol/ol-form-checkbox'
import OLButton from '@/shared/components/ol/ol-button'
import OLRow from '@/shared/components/ol/ol-row'
import OLCol from '@/shared/components/ol/ol-col'
import { useRefWithAutoFocus } from '@/shared/hooks/use-ref-with-auto-focus'

type UpdateUserModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'actionHandler' | 'showModal' | 'handleCloseModal'
>
const pickUserFields = ({ firstName, lastName, email, isAdmin }) => ({ firstName, lastName, email, isAdmin })

function UpdateUserModal({
  users,
  actionHandler,
  showModal,
  handleCloseModal,
}: UpdateUserModalProps) {
  const { t } = useTranslation()

  const { autoFocusedRef } = useRefWithAutoFocus<HTMLInputElement>()

  if (users.length !== 1) return null
  const [userData, setUserData] = useState(pickUserFields(users[0]))
  const isSelf = getMeta('ol-user_id') === users[0].id
  const allowUpdateDetails = users[0].allowUpdateDetails
  const allowUpdateIsAdmin = users[0].allowUpdateIsAdmin

  useEffect(() => {
    if (showModal) {
      setUserData(pickUserFields(users[0]))
    }
  }, [showModal, users])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget
    setUserData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.currentTarget
    setUserData(prev => ({ ...prev, [name]: checked }))
  }

  return (
    <UsersActionModal
      action="update"
      actionHandler={actionHandler}
      title={t('update_account_info')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
      options={{ userData }}
    >
      <OLFormGroup controlId="email-address">
        <OLFormLabel>{t('email_address')}</OLFormLabel>
        <OLFormControl
          ref={autoFocusedRef}
          maxLength="128"
          autoComplete="off"
          type="text"
          name="email"
          onChange={handleTextChange}
          value={userData.email}
        />
      </OLFormGroup>
      <OLFormGroup controlId="first-name">
        <OLFormLabel>{t('first_name')}</OLFormLabel>
        <OLFormControl
          maxLength="128"
          autoComplete="off"
          type="text"
          name="firstName"
          onChange={handleTextChange}
          value={userData.firstName}
          disabled={!allowUpdateDetails}
        />
      </OLFormGroup>
      <OLFormGroup controlId="last-name">
        <OLFormLabel>{t('last_name')}</OLFormLabel>
        <OLFormControl
          maxLength="128"
          autoComplete="off"
          type="text"
          name="lastName"
          onChange={handleTextChange}
          value={userData.lastName}
          disabled={!allowUpdateDetails}
        />
      </OLFormGroup>
      <OLRow>
        <OLCol xs={6}>
          <OLFormGroup controlId="is-admin-checkbox">
            <OLFormCheckbox
              autoComplete="off"
              onChange={handleCheckboxChange}
              name="isAdmin"
              label={"Set as admin"}
              checked={userData.isAdmin}
              disabled={isSelf || !allowUpdateIsAdmin}
            />
          </OLFormGroup>
        </OLCol>
      </OLRow>
    </UsersActionModal>
  )
}

export default UpdateUserModal
