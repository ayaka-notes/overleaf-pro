import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import DeleteUserModal from '../../../modals/delete-user-modal'
import { performDeleteUser, PostActions } from '../../../../util/user-actions'

type DeleteUserButtonProps = {
  user: User
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function DeleteUserButton({ user, children }: DeleteUserButtonProps) {
  const { t } = useTranslation()
  const text = t('delete')
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
  const handleDeleteUser = useCallback((user: User, options: any) => {
    return performDeleteUser(user, postActions, options)
  }, [postActions])

  if (user.deleted) return null

  return (
    <>
      {children(text, handleOpenModal)}
      <DeleteUserModal
        users={[user]}
        actionHandler={handleDeleteUser}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const DeleteUserButtonTooltip = memo(function DeleteUserButtonTooltip({
  user,
}: Pick<DeleteUserButtonProps, 'user'>) {
  return (
    <DeleteUserButton user={user}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-delete-user-${user.id}`}
          id={`delete-user-${user.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="delete"
            unfilled="true"
          />
        </OLTooltip>
      )}
    </DeleteUserButton>
  )
})

export default memo(DeleteUserButton)
export { DeleteUserButtonTooltip }
