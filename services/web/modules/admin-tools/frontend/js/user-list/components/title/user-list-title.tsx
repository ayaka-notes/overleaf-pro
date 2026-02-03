import { useMemo } from 'react'
import classnames from 'classnames'
import { Filter, useUserListContext } from '../../context/user-list-context'
import { useTranslation } from 'react-i18next'


function UserListTitle({
  filter,
  className,
}: {
  filter: Filter
  className?: string
}) {
  const { filterTranslations } = useUserListContext()

  let message = filterTranslations.get(filter)
  let extraProps = {}
  const { t } = useTranslation()

  return (
    <h1
      id="main-content"
      tabIndex={-1}
      className={classnames('user-list-title', className)}
      {...extraProps}
    >
      {t('user_management') + ' > ' + message}
    </h1>
  )
}

export default UserListTitle
