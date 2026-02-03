import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import FlagUserModal from '../../../modals/flag-user-modal'
import { performUpdateUser, PostActions } from '../../../../util/user-actions'

function FlagUsersButton({ action }: { action: string }) {
  const { selectedUsers, toggleSelectedUser, updateUserViewData } =
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

  const postActions: PostActions = { toggleSelectedUser, updateUserViewData }
  const handleFlagUser = async (user: User, options: any) => {
    await performUpdateUser(user, postActions, options)
  }

  let icon
  let unfilled
  switch (action) {
    case 'set_admin':
      icon = 'add_moderator'
      unfilled = true
      break
    case 'unset_admin':
      icon = 'remove_moderator'
      unfilled = true
      break
    case 'suspend':
      icon = 'pause'
      unfilled = false
      break
    case 'resume':
      icon = 'resume'
      unfilled = false
      break
    default:
      return null
  }

  return (
    <>
      <OLTooltip
        id={`tooltip-${action}-users`}
        description={text}
        overlayProps={{ placement: 'bottom', trigger: ['hover', 'focus'] }}
      >
        <OLIconButton
          onClick={handleOpenModal}
          variant="secondary"
          accessibilityLabel={text}
          icon={icon}
          unfilled={false}
        />
      </OLTooltip>
      <FlagUserModal
        users={selectedUsers}
        action={action}
        actionHandler={handleFlagUser}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

export default memo(FlagUsersButton)
