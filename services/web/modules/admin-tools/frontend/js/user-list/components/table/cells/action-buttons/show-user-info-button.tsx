import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import { useUserListContext } from '../../../../context/user-list-context'
import { User } from '../../../../../../../types/user/api'
import ShowUserInfoModal from '../../../modals/show-user-info-modal'

type ShowUserInfoButtonProps = {
  user: User
  children: (text: string, handleOpenModal: () => void) => React.ReactElement
}

function ShowUserInfoButton({ user, children }: ShowUserInfoButtonProps) {
  const { t } = useTranslation()
  const text = t('info')
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
  const handleShowUserInfo = useCallback((user: User) => {
    return performShowUserInfo(user)
  }, [])

  if (user.deleted) return null

  return (
    <>
      {children(text, handleOpenModal)}
      <ShowUserInfoModal
        users={[user]}
        showModal={showModal}
        handleCloseModal={handleCloseModal}
      />
    </>
  )
}

const ShowUserInfoButtonTooltip = memo(function ShowUserInfoButtonTooltip({
  user,
}: Pick<ShowUserInfoButtonProps, 'user'>) {
  return (
    <ShowUserInfoButton user={user}>
      {(text, handleOpenModal) => (
        <OLTooltip
          key={`tooltip-show-user-info-${user.id}`}
          id={`show-user-info-${user.id}`}
          description={text}
          overlayProps={{ placement: 'top', trigger: ['hover', 'focus'] }}
        >
          <OLIconButton
            onClick={handleOpenModal}
            variant="link"
            accessibilityLabel={text}
            className="action-btn"
            icon="info"
            unfilled={true}
          />
        </OLTooltip>
      )}
    </ShowUserInfoButton>
  )
})

export default memo(ShowUserInfoButton)
export { ShowUserInfoButtonTooltip }
