import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as eventTracking from '@/infrastructure/event-tracking'
import { isSmallDevice } from '@/infrastructure/event-tracking'
import { getUserFacingMessage } from '@/infrastructure/fetch-json'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import OLButton from '@/shared/components/ol/ol-button'
import {
  OLModal,
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
} from '@/shared/components/ol/ol-modal'
import Notification from '@/shared/components/notification'
import { User } from '../../../../../types/user/api'

type UsersActionModalProps = {
  title?: string
  action: 'info' | 'update' | 'delete' | 'purge' | 'restore' | 'suspend' | 'resume' | 'set_admin' | 'unset_admin' | 'resend'
  actionHandler?: (user: User, options?: any) => Promise<void>
  handleCloseModal: () => void
  users: Array<User>
  options?: any
  showModal: boolean
  actionIsDisabled?: boolean 
  children?: React.ReactNode
}

const greenActions = new Set(['update', 'restore', 'resume', 'unset_admin', 'resend'])
const redActions = new Set(['delete', 'purge', 'set_admin', 'suspend'])

function UsersActionModal({
  title,
  action,
  actionHandler,
  handleCloseModal,
  showModal,
  actionIsDisabled,
  users,
  options,
  children,
}: UsersActionModalProps) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<Array<any>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const isMounted = useIsMounted()

  const variant =
    redActions.has(action) ? 'danger' :
    greenActions.has(action) ? 'primary' : 'secondary'

  const actionLabel =
    action === 'update' ? t('confirm') :
    action === 'info' ? t('close') :
    action === 'set_admin' ? "Grant admin" :
    action === 'unset_admin' ? "Revoke admin" :
    t(action)

  async function handleActionForUsers(users: Array<User>, options?: any) {
    const errored = []
    setIsProcessing(true)
    setErrors([])

    if (actionHandler) {
      for (const user of users) {
        try {
          await actionHandler(user, options)
        } catch (e) {
          errored.push({ userName: user.email, error: e })
        }
      }
    }

    if (isMounted.current) {
      setIsProcessing(false)
    }

    if (errored.length === 0) {
      handleCloseModal()
    } else {
      setErrors(errored)
    }
  }

  useEffect(() => {
    if (showModal) {
      eventTracking.sendMB('admin-user-list-page-interaction', {
        action,
        isSmallDevice,
      })
    }
  }, [action, showModal])

  return (
    <OLModal
      animation
      show={showModal}
      onHide={handleCloseModal}
      id="action-user-modal"
      backdrop="static"
    >
      <OLModalHeader>
        <OLModalTitle>{title}</OLModalTitle>
      </OLModalHeader>
      <OLModalBody>
        {children}
        {!isProcessing &&
          errors.length > 0 &&
          errors.map((error, i) => (
            <div className="notification-list" key={i}>
              <Notification
                type="error"
                title={error.userName}
                content={getUserFacingMessage(error.error) as string}
              />
            </div>
          ))}
      </OLModalBody>
      <OLModalFooter>
        {action !== 'info' && (
          <OLButton variant="secondary" onClick={handleCloseModal}>
            {t('cancel')}
          </OLButton>
        )}
        <OLButton
          variant={variant}
          onClick={() => handleActionForUsers(users, options)}
          disabled={isProcessing || actionIsDisabled}
        >
          {actionLabel}
        </OLButton>
      </OLModalFooter>
    </OLModal>
  )
}

export default memo(UsersActionModal)
