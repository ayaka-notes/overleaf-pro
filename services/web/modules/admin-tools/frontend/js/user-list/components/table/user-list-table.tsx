import { useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import UserListTableRow from './user-list-table-row'
import { useUserListContext } from '../../context/user-list-context'
import useSort from '../../hooks/use-sort'
import withContent, { SortBtnProps } from '../sort/with-content'
import OLTable from '@/shared/components/ol/ol-table'
import OLFormCheckbox from '@/shared/components/ol/ol-form-checkbox'
import MaterialIcon from '@/shared/components/material-icon'

function SortBtn({ onClick, text, iconType, screenReaderText }: SortBtnProps) {
  return (
    <button
      className="table-header-sort-btn d-none d-md-inline-block"
      onClick={onClick}
      aria-label={screenReaderText}
    >
      <span>{text}</span>
      {iconType && <MaterialIcon type={iconType} />}
    </button>
  )
}

const SortByButton = withContent(SortBtn)

function UserListTable() {
  const { t } = useTranslation()
  const {
    visibleUsers,
    sort,
    selectedUsers,
    selectOrUnselectAllUsers,
    selfVisibleCount,
    filter,
  } = useUserListContext()
  const { handleSort } = useSort()
  const checkAllRef = useRef<HTMLInputElement>(null)

  const handleAllUsersCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      selectOrUnselectAllUsers(event.target.checked)
    },
    [selectOrUnselectAllUsers]
  )

  useEffect(() => {
    if (checkAllRef.current) {
      checkAllRef.current.indeterminate =
        selectedUsers.length > 0 &&
        selectedUsers.length + selfVisibleCount !== visibleUsers.length
    }
  }, [selectedUsers, visibleUsers])

  return (
    <OLTable className="user-dash-table" container={false} hover>
      <caption className="visually-hidden">{t('users_list')}</caption>
      <thead className="visually-hidden-max-md">
        <tr>
          <th
            className="dash-cell-checkbox d-none d-md-table-cell"
            aria-label={t('select_users')}
          >
            <OLFormCheckbox
              name="select_all_users"
              autoComplete="off"
              onChange={handleAllUsersCheckboxChange}
              checked={
                visibleUsers.length === selectedUsers.length + selfVisibleCount  &&
                visibleUsers.length - selfVisibleCount !== 0
              }
              disabled={visibleUsers.length - selfVisibleCount === 0}
              aria-label={t('select_all_users')}
              inputRef={checkAllRef}
            />
          </th>
          <th
            className="dash-cell-name"
            aria-label={t('title')}
            aria-sort={
              sort.by === 'title'
                ? sort.order === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
          >
            <SortByButton
              column="name"
              text={t('name')}
              sort={sort}
              onClick={() => handleSort('name')}
            />
          </th>
          <th
            className="dash-cell-email-date d-md-none"
            aria-label={t('date_and_owner')}
          >
            {t('date_and_owner')}
          </th>
          <th
            className="dash-cell-email d-none d-md-table-cell"
            aria-label={t('email')}
            aria-sort={
              sort.by === 'email'
                ? sort.order === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
          >
            <SortByButton
              column="email"
              text={t('email')}
              sort={sort}
              onClick={() => handleSort('email')}
            />
          </th>
          {filter !== 'deleted' ? (
            <th
              className="dash-cell-date-signup d-none d-md-table-cell"
              aria-label={t('sign_up')}
              aria-sort={
                sort.by === 'signUpDate'
                  ? sort.order === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              <SortByButton
                column="signUpDate"
                text={t('sign_up')}
                sort={sort}
                onClick={() => handleSort('signUpDate')}
              />
            </th>
          ) : (
            <th
              className="dash-cell-date-signup d-none d-md-table-cell"
              aria-label={t('deleted_at')}
              aria-sort={
                sort.by === 'deletedAt'
                  ? sort.order === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              <SortByButton
                column="deletedAt"
                text={t('deleted_at')}
                sort={sort}
                onClick={() => handleSort('deletedAt')}
              />
            </th>
          )}
          <th
            className="dash-cell-date-active d-none d-md-table-cell"
            aria-label={t('last_active')}
            aria-sort={
              sort.by === 'lastActive'
                ? sort.order === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
          >
            <SortByButton
              column="lastActive"
              text={t('last_active')}
              sort={sort}
              onClick={() => handleSort('lastActive')}
            />
          </th>
          <th className="dash-cell-actions" aria-label={t('actions')}>
            {t('actions')}
          </th>
        </tr>
      </thead>
      <tbody>
        {visibleUsers.length > 0 ? (
          visibleUsers.map(u => (
            <UserListTableRow
              user={u}
              selected={selectedUsers.some(({ id }) => id === u.id)}
              key={u.id}
              filter={filter}
            />
          ))
        ) : (
          <tr className="no-users">
            <td className="text-center" colSpan={5}>
              {t('no_search_results')}
            </td>
          </tr>
        )}
      </tbody>
    </OLTable>
  )
}

export default UserListTable
