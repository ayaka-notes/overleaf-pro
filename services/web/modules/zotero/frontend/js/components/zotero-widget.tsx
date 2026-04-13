import { useTranslation } from 'react-i18next'
import { useCallback, useState } from 'react'
import { postJSON } from '@/infrastructure/fetch-json'
import getMeta from '@/utils/meta'
import OLButton from '@/shared/components/ol/ol-button'
import OLNotification from '@/shared/components/ol/ol-notification'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import ZoteroLogo from '@/shared/svgs/zotero-logo'

export default function ZoteroWidget() {
  const { t } = useTranslation()
  const user = getMeta('ol-user')
  const refProviders = user?.refProviders || {}
  const [isLinked, setIsLinked] = useState(Boolean(refProviders.zotero))
  const [apiKey, setApiKey] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!apiKey) return
      setProcessing(true)
      setError('')
      setSuccess('')
      try {
        await postJSON('/zotero/link', { body: { apiKey } })
        setSuccess(t('zotero_account_linked_successfully'))
        setApiKey('')
        setIsLinked(true)
      } catch (err: any) {
        const msg =
          err?.data?.error === 'invalid_api_key'
            ? t('zotero_api_key_invalid')
            : t('generic_something_went_wrong')
        setError(msg)
      } finally {
        setProcessing(false)
      }
    },
    [apiKey, t]
  )

  const handleUnlink = useCallback(async () => {
    setProcessing(true)
    setError('')
    setSuccess('')
    try {
      await postJSON('/zotero/unlink')
      setIsLinked(false)
    } catch {
      setError(t('generic_something_went_wrong'))
    } finally {
      setProcessing(false)
    }
  }, [t])

  return (
    <div className="settings-widget-container">
      <div>
        <ZoteroLogo />
      </div>
      <div className="description-container">
        <div className="title-row">
          <h4>{t('zotero')}</h4>
        </div>
        <p className="small">
          {t('zotero_sync_description', {
            appName: getMeta('ol-ExposedSettings')?.appName || 'Overleaf',
          })}
        </p>
        {error && <OLNotification type="error" content={error} />}
        {success && <OLNotification type="success" content={success} />}
        {!isLinked && (
          <form onSubmit={handleLink}>
            <p className="small text-muted">
              Create an API key at{' '}
              <a
                href="https://www.zotero.org/settings/keys/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                zotero.org/settings/keys
              </a>{' '}
              with <strong>Allow library access</strong> and{' '}
              <strong>Allow read access to all groups</strong> enabled.
            </p>
            <div className="form-group">
              <OLFormControl
                type="text"
                placeholder="Paste your Zotero API key"
                value={apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setApiKey(e.target.value.trim())
                }
                disabled={processing}
                autoComplete="off"
              />
            </div>
            <OLButton
              variant="primary"
              type="submit"
              disabled={!apiKey}
              isLoading={processing}
            >
              {t('link_to_zotero')}
            </OLButton>
          </form>
        )}
      </div>
      <div>
        {isLinked && (
          <OLButton
            variant="danger-ghost"
            onClick={handleUnlink}
            isLoading={processing}
          >
            {t('unlink')}
          </OLButton>
        )}
      </div>
    </div>
  )
}
