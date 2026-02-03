import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import UpdateUserModal from '../../../modals/update-user-modal'
import { performUpdateUser, PostActions } from '../../../../util/user-actions'

type UpdateUserButtonProps = {
  user: User
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function UpdateUserButton({ user, children }: UpdateUserButtonProps) {
  const { t } = useTranslation()
  const text = t('update')
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
  const handleUpdateUser = useCallback((user: User, options: any) => {
    return performUpdateUser(user, postActions, options)
  }, [postActions])

  if (user.deleted) return null

  return (
    <>
      {children(text, handleOpenModal)}
      <UpdateUserModal
        users={[user]}
        actionHandler={handleUpdateUser}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const UpdateUserButtonTooltip = memo(function UpdateUserButtonTooltip({
  user,
}: Pick<UpdateUserButtonProps, 'user'>) {
  return (
    <UpdateUserButton user={user}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-update-user-${user.id}`}
          id={`update-user-${user.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="edit"
            unfilled={false}
          />
        </OLTooltip>
      )}
    </UpdateUserButton>
  )
})

export default memo(UpdateUserButton)
export { UpdateUserButtonTooltip }
