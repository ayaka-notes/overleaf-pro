import { useTranslation } from 'react-i18next'
import { useUserListContext } from '../context/user-list-context'
import OLButton from '@/shared/components/ol/ol-button'

export default function LoadMore() {
  const {
    visibleUsers,
    hiddenUsersCount,
    loadMoreCount,
    showAllUsers,
    loadMoreUsers,
  } = useUserListContext()
  const { t } = useTranslation()

  return (
    <div className="text-center">
      {hiddenUsersCount > 0 ? (
        <>
          <OLButton
            variant="secondary"
            className="user-list-load-more-button"
            onClick={() => loadMoreUsers()}
          >
            {/* {t('show_x_more_users', { x: loadMoreCount })} */}
            {"Show more " + loadMoreCount + " users"}
          </OLButton>
        </>
      ) : null}
      <p>
        {hiddenUsersCount > 0 ? (
          <>
            <span aria-live="polite">
              {t('showing_x_out_of_n_users', {
                x: visibleUsers.length,
                n: visibleUsers.length + hiddenUsersCount,
              })}
            </span>{' '}
            {
              hiddenUsersCount <= 200 &&
              <OLButton
                variant="link"
                onClick={() => showAllUsers()}
                className="btn-inline-link"
              >
                {t('view_all')}
              </OLButton>
            }
          </>
        ) : (
          <span aria-live="polite">
            {t('showing_x_out_of_n_users', {
              x: visibleUsers.length,
              n: visibleUsers.length,
            })}
          </span>
        )}
      </p>
    </div>
  )
}
