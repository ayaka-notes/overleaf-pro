import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserListContext } from '../../../context/user-list-context'
import DeleteUsersButton from './buttons/delete-users-button'
import PurgeUsersButton from './buttons/purge-users-button'
import RestoreUsersButton from './buttons/restore-users-button'
import FlagUsersButton from './buttons/flag-users-button'
import SendRegEmailsButton from './buttons/send-reg-emails-button'
import OLButtonToolbar from '@/shared/components/ol/ol-button-toolbar'
import OLButtonGroup from '@/shared/components/ol/ol-button-group'

function UserTools() {
  const { t } = useTranslation()
  const { filter, selectedUsers } = useUserListContext()

  return (
    <OLButtonToolbar aria-label={t('toolbar_selected_users')}>

      {(filter === 'deleted') && (
        <OLButtonGroup aria-label={t('toolbar_selected_users_restore')}>
          <RestoreUsersButton />
        </OLButtonGroup>
      )}

      {(filter !== 'deleted') && (
      <OLButtonGroup aria-label={t('toolbar_selected_users_suspend_status')}>
         {filter !== 'suspended' && <FlagUsersButton action={'suspend'} />}
         <FlagUsersButton action={'resume'} />
         {filter !== 'suspended' && <SendRegEmailsButton />}
      </OLButtonGroup>
      )}

      {(filter !== 'deleted') && (
        <OLButtonGroup aria-label={t('toolbar_selected_users_admin_status')}>
          {(filter !== 'admin' && filter !== 'suspended') && <FlagUsersButton action={'set_admin'} />}
          <FlagUsersButton action={'unset_admin'} />
        </OLButtonGroup>
      )}

      {(filter !== 'deleted') && (
        <OLButtonGroup aria-label={t('toolbar_selected_users_remove')}>
          <DeleteUsersButton />
        </OLButtonGroup>
      )}

      {(filter === 'deleted') && (
        <OLButtonGroup aria-label={t('toolbar_selected_users_purge')}>
          <PurgeUsersButton />
        </OLButtonGroup>
      )}

    </OLButtonToolbar>
  )
}

export default memo(UserTools)
