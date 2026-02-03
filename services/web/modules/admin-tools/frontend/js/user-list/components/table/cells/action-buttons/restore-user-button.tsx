import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import RestoreUserModal from '../../../modals/restore-user-modal'
import { performRestoreUser, PostActions } from '../../../../util/user-actions'

type RestoreUserButtonProps = {
  user: User
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function RestoreUserButton({ user, children }: RestoreUserButtonProps) {
  const { t } = useTranslation()
  const text = t('restore')
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

  const { toggleSelectedUser, updateUserViewData } = useUserListContext()
  const postActions: PostActions = { toggleSelectedUser, updateUserViewData }
  const handleRestoreUser = useCallback((user: User) => {
    return performRestoreUser(user, postActions)
  }, [user, postActions])

  if (!user.deleted) return null

  return (
    <>
      {children(text, handleOpenModal)}
      <RestoreUserModal
        users={[user]}
        actionHandler={handleRestoreUser}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const RestoreUserButtonTooltip = memo(function RestoreUserButtonTooltip({
  user,
}: Pick<RestoreUserButtonProps, 'user'>) {
  return (
    <RestoreUserButton user={user}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-restore-user-${user.id}`}
          id={`restore-user-${user.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="restore"
          />
        </OLTooltip>
      )}
    </RestoreUserButton>
  )
})

export default memo(RestoreUserButton)
export { RestoreUserButtonTooltip }
