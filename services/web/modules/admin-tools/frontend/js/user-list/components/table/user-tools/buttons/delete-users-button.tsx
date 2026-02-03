import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLButton from '@/shared/components/ol/ol-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import DeleteUserModal from '../../../modals/delete-user-modal'
import { performDeleteUser, PostActions } from '../../../../util/user-actions'

type DeleteUserResult = {
  success: boolean
  message: string
  user: Partial<User>
}

function DeleteUsersButton() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const isMounted = useIsMounted()

  const handleOpenModal = () => {
    setShowModal(true)
  }
  const handleCloseModal = () => {
    if (isMounted.current) {
      setShowModal(false)
    }
  }

  const { selectedUsers, toggleSelectedUser, updateUserViewData } = useUserListContext()
  const postActions: Partial<PostActions> = { toggleSelectedUser, updateUserViewData }

  const handleDeleteUser = (user: User, options: any) => {
    return performDeleteUser(user, postActions, options)
  }

  return (
    <>
      <OLButton variant="danger" onClick={handleOpenModal}>
        {t('delete')}
      </OLButton>
      <DeleteUserModal
        users={selectedUsers}
        actionHandler={handleDeleteUser}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

export default DeleteUsersButton
