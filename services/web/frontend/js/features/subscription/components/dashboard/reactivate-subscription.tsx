import { useTranslation } from 'react-i18next'
import { postJSON } from '../../../../infrastructure/fetch-json'
import { reactivateSubscriptionUrl } from '../../data/subscription-url'
import useAsync from '../../../../shared/hooks/use-async'
import { useLocation } from '../../../../shared/hooks/use-location'
import getMeta from '../../../../utils/meta'
import { debugConsole } from '@/utils/debugging'
import OLButton from '@/shared/components/ol/ol-button'

function ReactivateSubscription() {
  const { t } = useTranslation()
  const { isLoading, isSuccess, runAsync } = useAsync()
  const location = useLocation()

  const handleReactivate = () => {
    runAsync(postJSON(reactivateSubscriptionUrl)).catch(debugConsole.error)
  }

  if (isSuccess) {
    location.reload()
  }

  // Don't show the button to reactivate the subscription for managed users,
  // unless they are a managed group admin (who should be able to reactivate their own subscription)
  if (
    getMeta('ol-cannot-reactivate-subscription') &&
    !getMeta('ol-isManagedGroupAdmin')
  ) {
    return null
  }

  return (
    <OLButton
      variant="primary"
      disabled={isLoading || isSuccess}
      onClick={handleReactivate}
      isLoading={isLoading}
      loadingLabel={t('reactivating')}
    >
      {t('reactivate_subscription')}
    </OLButton>
  )
}

export default ReactivateSubscription
