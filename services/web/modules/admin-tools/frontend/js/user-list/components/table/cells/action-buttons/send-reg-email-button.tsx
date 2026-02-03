import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import SendRegEmailModal from '../../../modals/send-reg-email-modal'
import { performSendRegEmail, PostActions } from '../../../../util/user-actions'

type SendRegEmailButtonProps = {
  user: User
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function SendRegEmailButton({ user, children }: SendRegEmailButtonProps) {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const isMounted = useIsMounted()
  const text = t('resend')

  const handleOpenModal = useCallback(() => {
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    if (isMounted.current) {
      setShowModal(false)
    }
  }, [isMounted])

  const { toggleSelectedUser, updateUserViewData } = useUserListContext()
  const postActions: PostActions = { toggleSelectedUser }
  const handleSendRegEmail = useCallback((user: User) => {
    return performSendRegEmail(user, postActions)
  }, [postActions])

  if (user.deleted) return null

  const isHidden = !user.authMethods.includes('local') || user.suspended

  return (
    <span style={isHidden ? { visibility: 'hidden' } : undefined }>
      {children(text, handleOpenModal)}
      <SendRegEmailModal
        users={[user]}
        actionHandler={handleSendRegEmail}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </span>
  )
}

const SendRegEmailButtonTooltip = memo(function SendRegEmailButtonTooltip({
  user,
}: Pick<SendRegEmailButtonProps, 'user'>) {

  return (
    <SendRegEmailButton user={user}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-send-reg-email-${user.id}`}
          id={`send-reg-email-${user.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon='mail'
            size='sm'
            unfilled={false}
          />
        </OLTooltip>
      )}
    </SendRegEmailButton>
  )
})

export default memo(SendRegEmailButton)
export { SendRegEmailButtonTooltip }
