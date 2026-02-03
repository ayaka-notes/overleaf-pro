import { ChangeEvent, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import getMeta from '@/utils/meta'
import { useUserListContext } from '../../context/user-list-context'
import OLFormCheckbox from '@/shared/components/ol/ol-form-checkbox'

export const UserCheckbox = memo<{ userId: string; userName: string }>(
  ({ userId, userName }) => {
    const { t } = useTranslation()
    const { selectedUserIds, toggleSelectedUser } =
      useUserListContext()

    const isSelf = useMemo(() => {
      return getMeta('ol-user_id') === userId
    }, [userId])

    const handleCheckboxChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        toggleSelectedUser(userId, event.target.checked)
      },
      [userId, toggleSelectedUser]
    )

    return (
      <OLFormCheckbox
        id={`select_user_${userId}`}
        autoComplete="off"
        onChange={handleCheckboxChange}
        checked={selectedUserIds.has(userId)}
        disabled={isSelf}
        aria-label={t('select_user', { user: userName })}
        data-user-id={userId}
      />
    )
  }
)

UserCheckbox.displayName = 'UserCheckbox'
