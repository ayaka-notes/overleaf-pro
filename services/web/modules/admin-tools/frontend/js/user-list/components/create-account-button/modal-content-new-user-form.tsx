import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useAsync from '@/shared/hooks/use-async'
import { debugConsole } from '@/utils/debugging'
import {
  getUserFacingMessage,
  postJSON,
} from '@/infrastructure/fetch-json'
import { useRefWithAutoFocus } from '@/shared/hooks/use-ref-with-auto-focus'
import Notification from '@/shared/components/notification'
import {
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
} from '@/shared/components/ol/ol-modal'
import OLButton from '@/shared/components/ol/ol-button'
import OLRow from '@/shared/components/ol/ol-row'
import OLCol from '@/shared/components/ol/ol-col'
import OLForm from '@/shared/components/ol/ol-form'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormLabel from '@/shared/components/ol/ol-form-label'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import OLFormCheckbox from '@/shared/components/ol/ol-form-checkbox'
import getMeta from '@/utils/meta'
import { useUserListContext } from '../../context/user-list-context'
import { User } from '../../../../../types/user/api'

type CreateUserResult = {
  user: User
}

type Props = {
  handleCloseModal: () => void
}

const availableAuthMethods = getMeta("ol-availableAuthMethods")
const onlyLocalAuthEnabled = (availableAuthMethods.length === 1 && availableAuthMethods[0] === 'local')

function ModalContentNewUserForm({ handleCloseModal }: Props) {
  const { t } = useTranslation()
  const { autoFocusedRef } = useRefWithAutoFocus<HTMLInputElement>()
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    isAdmin: false,
    isExternal: false,
  })

  const { refreshUsers, addUserToView } = useUserListContext()
  const [redirecting, setRedirecting] = useState(false)
  const { isLoading, isError, error, runAsync } = useAsync<CreateUserResult>()

  const createAccount = () => {
    runAsync(
      postJSON('/admin/user/create', {
        body: {
          email: userData.email.trim(),
          first_name: userData.firstName.trim(),
          last_name: userData.lastName.trim(),
          isAdmin: userData.isAdmin,
          isExternal: userData.isExternal,
        }
      })
    )
      .then(data => {
        addUserToView(data.user)
        handleCloseModal()
      })
      .catch(debugConsole.error)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget
    setUserData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.currentTarget
    setUserData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAccount()
  }

  return (
    <>
      <OLModalHeader>
        <OLModalTitle>{t('create_account')}</OLModalTitle>
      </OLModalHeader>

      <OLModalBody>
        {isError && (
          <div className="notification-list">
            <Notification
              type="error"
              content={t(getUserFacingMessage(error)) as string}
            />
          </div>
        )}

        <OLForm onSubmit={handleSubmit}>
         <OLFormGroup controlId="email-address">
            <OLFormLabel>{t('email_address')}</OLFormLabel>
            <OLFormControl
              maxLength="128"
              autoComplete="off"
              type="text"
              name="email"
              placeholder="example@email.com"
              ref={autoFocusedRef}
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
              placeholder="Erika"
              onChange={handleTextChange}
              value={userData.firstName}
            />
          </OLFormGroup>
          <OLFormGroup controlId="last-name">
            <OLFormLabel>{t('last_name')}</OLFormLabel>
            <OLFormControl
              maxLength="128"
              autoComplete="off"
              type="text"
              name="lastName"
              placeholder="Mustermann"
              onChange={handleTextChange}
              value={userData.lastName}
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
                  aria-label={"Set as admin"}
                />
              </OLFormGroup>
            </OLCol>
            {(!onlyLocalAuthEnabled &&
              <OLCol xs={6}>
                <OLFormGroup controlId="is-external-checkbox">
                  <OLFormCheckbox
                    autoComplete="off"
                    onChange={handleCheckboxChange}
                    name="isExternal"
                    label="External authentication"
                    checked={userData.isExternal}
                    aria-label={"External authentication"}
                  />
                </OLFormGroup>
              </OLCol>
            )}
          </OLRow>
        </OLForm>
      </OLModalBody>

      <OLModalFooter>
        <OLButton variant="secondary" onClick={handleCloseModal}>
          {t('cancel')}
        </OLButton>
        <OLButton
          variant="primary"
          onClick={createAccount}
          disabled={userData.email.trim() === '' ||
                    userData.lastName.trim() === '' ||
                    userData.firstName.trim() === '' ||
                    isLoading || redirecting}
          isLoading={isLoading}
          loadingLabel={t('creating')}
        >
          {t('create')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}

export default ModalContentNewUserForm
