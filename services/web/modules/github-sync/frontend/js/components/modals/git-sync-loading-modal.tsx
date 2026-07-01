import { useTranslation } from 'react-i18next'
import {
  OLModalBody,
  OLModalFooter,
} from '@/shared/components/ol/ol-modal'
import OLButton from '@/shared/components/ol/ol-button'
import OLNotification from '@/shared/components/ol/ol-notification'
import { GitSyncModalStatus } from '../../types/git-sync-types'

type GitSyncLoadingModalProps = {
  handleHide: () => void
  setModalStatus: (modalStatus: GitSyncModalStatus) => void
  errorMessage: string | null
}
const GitSyncLoadingModal = ({ handleHide, setModalStatus, errorMessage }: GitSyncLoadingModalProps) => {
  const { t } = useTranslation()

  return (
    <>
      <OLModalBody>
        <div role="status" className="loading align-items-start">
          <div aria-hidden="true" data-testid="ol-spinner" className="spinner-border spinner-border-sm"></div>
          {t('checking_project_github_status')}
        </div>
      </OLModalBody>

      {errorMessage && (
        <OLNotification
          type="error"
          content={errorMessage}
        />
      )}

      <OLModalFooter>
        {errorMessage && (
          <OLButton
            variant="danger-ghost"
            onClick={() => setModalStatus('confirm-unlink')}
          >
            {t('unlink')}
          </OLButton>
        )}
        <OLButton
          variant="secondary"
          onClick={handleHide}
        >
          {t('cancel')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}

export default GitSyncLoadingModal
