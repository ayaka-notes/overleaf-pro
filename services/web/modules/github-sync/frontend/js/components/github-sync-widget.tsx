import { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  postJSON,
  getJSON,
} from '../../../../../frontend/js/infrastructure/fetch-json'
import OLButton from '@/shared/components/ol/ol-button'
import {
  OLModal,
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
} from '@/shared/components/ol/ol-modal'
import OLNotification from '@/shared/components/ol/ol-notification'
import GithubLogo from '@/shared/svgs/github-logo'

type GitHubStatus = {
  available: boolean
  enabled: boolean
}

export default function GitHubSyncWidget() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<GitHubStatus>({ available: false, enabled: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getJSON<GitHubStatus>('/user/github-sync/status')
      setStatus(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GitHub status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true)
    setError('')

    try {
      await postJSON('/github-sync/unlink')
      setStatus({ available: true, enabled: false })
      setShowDisconnectModal(false)
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect GitHub account')
    } finally {
      setDisconnecting(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="settings-widget-container">
        <div>
          <GithubLogo />
        </div>
        <div className="description-container">
          <div className="title-row">
            <h4>GitHub</h4>
          </div>
          <p className="small">{t('loading')}...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="settings-widget-container">
        <div>
          <GithubLogo size={40} />
        </div>
        <div className="description-container">
          <div className="title-row">
            <h4 id="github-sync">GitHub</h4>
          </div>
          <p className="small">
            {t('github_sync_description', {
              defaultValue:
                'Sync your Overleaf projects with GitHub repositories.',
            })}
          </p>
          {error && <OLNotification type="error" content={error} />}
        </div>
        <div>
          {status.enabled ? (
            <OLButton
              variant="danger-ghost"
              onClick={() => setShowDisconnectModal(true)}
              disabled={disconnecting}
            >
              {disconnecting ? t('unlinking') : t('unlink')}
            </OLButton>
          ) : (
            <OLButton
              variant="secondary"
              href="/github-sync/beginAuth"
            >
              {t('link')}
            </OLButton>
          )}
        </div>
      </div>


      {/* Disconnect Confirmation Modal */}
      <OLModal 
        show={showDisconnectModal}
        onHide={() => setShowDisconnectModal(false)}
        backdrop="static" initialFocus={false} enforceFocus={false}
      >
        <OLModalHeader>
          <OLModalTitle>
            {t('unlink_provider_account_title', { provider: 'GitHub' })}
          </OLModalTitle>
        </OLModalHeader>
        <OLModalBody>
          <p>{t('unlink_github_warning', { provider: 'GitHub' })}</p>
        </OLModalBody>
        <OLModalFooter>
          <OLButton
            variant="secondary"
            onClick={() => setShowDisconnectModal(false)}
          >
            {t('cancel')}
          </OLButton>
          <OLButton
            variant="danger-ghost"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? t('unlinking') : t('unlink')}
          </OLButton>
        </OLModalFooter>
      </OLModal>
    </>
  )
}