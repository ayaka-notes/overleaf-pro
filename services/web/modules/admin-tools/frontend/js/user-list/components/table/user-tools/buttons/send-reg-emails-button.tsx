import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import SendRegEmailModal from '../../../modals/send-reg-email-modal'
import { performSendRegEmail } from '../../../../util/user-actions'

function SendRegEmailsButton({ action }: { action: string }) {
  const { selectedUsers, toggleSelectedUser } =
    useUserListContext()
  const { t } = useTranslation()
  const text = t(action)

  const [showModal, setShowModal] = useState(false)
  const isMounted = useIsMounted()

  const handleOpenModal = useCallback(() => {
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    if (isMounted.current) {
      setShowModal(false)
    }
  }, [isMounted])

  const postActions: PostActions = { toggleSelectedUser }
  const handleSendRegEmail = async (user: User) => {
    await performSendRegEmail(user, postActions)
  }

  return (
    <>
      <OLTooltip
        id={`tooltip-resend-users`}
        description={t('resend')}
        overlayProps={{ placement: 'bottom', trigger: ['hover', 'focus'] }}
      >
        <OLIconButton
          onClick={handleOpenModal}
          variant="secondary"
          accessibilityLabel={text}
          icon={'mail'}
          unfilled={false}
        />
      </OLTooltip>
      <SendRegEmailModal
        users={selectedUsers}
        actionHandler={handleSendRegEmail}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

export default memo(SendRegEmailsButton)
