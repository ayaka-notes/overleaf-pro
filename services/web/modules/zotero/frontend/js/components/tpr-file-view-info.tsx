import { useTranslation } from 'react-i18next'
import { formatTime, relativeDate } from '@/features/utils/format-date'
import { LinkedFileIcon } from '@/features/file-view/components/file-view-icons'
import type { BinaryFile } from '@/features/file-view/types/binary-file'

type TPRFileViewInfoProps = {
  file: BinaryFile
}

export function TPRFileViewInfo({ file }: TPRFileViewInfoProps) {
  const { t } = useTranslation()

  if (file.linkedFileData?.provider !== 'zotero') {
    return null
  }

  const importedAt = (file.linkedFileData as any)?.importedAt || file.created
  const formattedDate = formatTime(importedAt)
  const relative = relativeDate(importedAt)
  const groupId = (file.linkedFileData as any)?.zoteroGroupId

  return (
    <p>
      <LinkedFileIcon />
      &nbsp;
      {t('imported_from_zotero_at_date', {
        formattedDate,
        relativeDate: relative,
      })}
      {groupId && <span className="text-muted small"> (Group: {groupId})</span>}
    </p>
  )
}
