import { useTranslation } from 'react-i18next'
import type { BinaryFile } from '@/features/file-view/types/binary-file'
import OLNotification from '@/shared/components/ol/ol-notification'
import getMeta from '@/utils/meta'

type TPRFileViewNotOriginalImporterProps = {
  file: BinaryFile
}

export function TPRFileViewNotOriginalImporter({
  file,
}: TPRFileViewNotOriginalImporterProps) {
  const provider = file.linkedFileData?.provider
  const { t } = useTranslation()

  if (provider !== 'zotero') {
    return null
  }

  const currentUserId =
    (getMeta('ol-user') as any)?._id || (getMeta('ol-user_id') as string)
  const importedByUserId = (file.linkedFileData as any)?.importedByUserId

  if (!importedByUserId) {
    return (
      <div className="file-view-error">
        <OLNotification
          type="warning"
          content={t('zotero_imported_by_unknown')}
        />
      </div>
    )
  }

  if (currentUserId && importedByUserId !== currentUserId) {
    return (
      <div className="file-view-error">
        <OLNotification
          type="warning"
          content={t('zotero_imported_by_collaborator')}
        />
      </div>
    )
  }

  return null
}
