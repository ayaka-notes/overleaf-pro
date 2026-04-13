import { useTranslation } from 'react-i18next'
import OLButton from '@/shared/components/ol/ol-button'
import type { BinaryFile } from '@/features/file-view/types/binary-file'
import getMeta from '@/utils/meta'

type TPRFileViewRefreshButtonProps = {
  file: BinaryFile
  refreshFile: (isTPR: boolean | null) => void
  refreshing: boolean
}

export function TPRFileViewRefreshButton({
  file,
  refreshFile,
  refreshing,
}: TPRFileViewRefreshButtonProps) {
  const { t } = useTranslation()
  const provider = (file.linkedFileData as Record<string, unknown>)?.provider
  const currentUserId =
    (getMeta('ol-user') as any)?._id || (getMeta('ol-user_id') as string)
  const importedByUserId = (file.linkedFileData as any)?.importedByUserId
  const isOriginalImporter =
    provider === 'zotero' &&
    currentUserId &&
    importedByUserId === currentUserId

  if (provider !== 'zotero' || isOriginalImporter) {
    return (
      <OLButton
        variant="primary"
        onClick={() => refreshFile(provider === 'zotero' ? true : null)}
        disabled={refreshing}
        isLoading={refreshing}
        loadingLabel={t('refreshing')}
      >
        {t('refresh')}
      </OLButton>
    )
  }

  return (
    <OLButton variant="primary" disabled>
      {t('refresh')}
    </OLButton>
  )
}
