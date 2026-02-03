import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import PurgeUserModal from '../../../modals/purge-user-modal'
import { performPurgeUser, PostActions } from '../../../../util/user-actions'

type PurgeUserButtonProps = {
  user: User
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function PurgeUserButton({ user, children }: PurgeUserButtonProps) {
  const { t } = useTranslation()
  const text = t('purge')
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

  const { removeUserFromView } = useUserListContext()
  const postActions: PostActions = { removeUserFromView }
  const handlePurgeUser = useCallback((user: User) => {
    return performPurgeUser(user, postActions)
  }, [user, postActions])

  if (!user.deleted) return null

  return (
    <>
      {children(text, handleOpenModal)}
      <PurgeUserModal
        users={[user]}
        actionHandler={handlePurgeUser}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const PurgeUserButtonTooltip = memo(function PurgeUserButtonTooltip({
  user,
}: Pick<PurgeUserButtonProps, 'user'>) {
  return (
    <PurgeUserButton user={user}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-purge-user-${user.id}`}
          id={`purge-user-${user.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="delete_forever"
          />
        </OLTooltip>
      )}
    </PurgeUserButton>
  )
})

export default memo(PurgeUserButton)
export { PurgeUserButtonTooltip }
