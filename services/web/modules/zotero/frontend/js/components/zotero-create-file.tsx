import { useTranslation } from 'react-i18next'
import { FormEventHandler, useEffect, useState, useCallback } from 'react'
import { getJSON } from '@/infrastructure/fetch-json'
import { useFileTreeActionable } from '@/features/file-tree/contexts/file-tree-actionable'
import { useFileTreeCreateForm } from '@/features/file-tree/contexts/file-tree-create-form'
import { useFileTreeMainContext } from '@/features/file-tree/contexts/file-tree-main'
import FileTreeModalCreateFileMode from '@/features/file-tree/components/file-tree-create/file-tree-modal-create-file-mode'
import ErrorMessage from '@/features/file-tree/components/file-tree-create/error-message'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormLabel from '@/shared/components/ol/ol-form-label'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import OLFormSelect from '@/shared/components/ol/ol-form-select'
import OLNotification from '@/shared/components/ol/ol-notification'

type ZoteroGroup = {
  id: string
  name: string
}

export function CreateFileMode() {
  const { refProviders } = useFileTreeMainContext()
  const isLinked = (refProviders as Record<string, boolean>)?.zotero

  if (!isLinked) {
    return null
  }

  return (
    <FileTreeModalCreateFileMode
      mode="zotero"
      icon="library_books"
      label="From Zotero"
    />
  )
}

export function CreateFilePane() {
  const { t } = useTranslation()
  const { setValid } = useFileTreeCreateForm()
  const { newFileCreateMode, finishCreatingLinkedFile, error, inFlight } =
    useFileTreeActionable()

  const [groups, setGroups] = useState<ZoteroGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [name, setName] = useState('zotero.bib')
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [groupsError, setGroupsError] = useState('')

  useEffect(() => {
    setValid(!!name && !loadingGroups)
  }, [setValid, name, loadingGroups])

  useEffect(() => {
    if (newFileCreateMode !== 'zotero') return

    setLoadingGroups(true)
    setGroupsError('')
    getJSON('/zotero/groups')
      .then((data: { groups: ZoteroGroup[] }) => {
        setGroups(data.groups || [])
      })
      .catch(() => {
        setGroupsError(t('zotero_groups_loading_error'))
      })
      .finally(() => {
        setLoadingGroups(false)
      })
  }, [newFileCreateMode, t])

  const handleSubmit: FormEventHandler = useCallback(
    event => {
      event.preventDefault()

      const data: Record<string, string> = {}
      if (selectedGroupId) {
        data.zoteroGroupId = selectedGroupId
      }

      finishCreatingLinkedFile({
        name,
        provider: 'zotero',
        data,
      })
    },
    [name, selectedGroupId, finishCreatingLinkedFile]
  )

  if (newFileCreateMode !== 'zotero') {
    return null
  }

  return (
    <form
      className="form-controls"
      id="create-file"
      noValidate
      onSubmit={handleSubmit}
    >
      {groupsError && (
        <OLNotification type="error" content={groupsError} className="mb-3" />
      )}

      <OLFormGroup controlId="zotero-file-name">
        <OLFormLabel>{t('file_name')}</OLFormLabel>
        <OLFormControl
          type="text"
          placeholder="zotero.bib"
          required
          value={name}
          disabled={inFlight}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
      </OLFormGroup>

      <OLFormGroup controlId="zotero-library-select">
        <OLFormLabel>Library</OLFormLabel>
        {loadingGroups ? (
          <p className="text-muted">{t('loading')}...</p>
        ) : (
          <OLFormSelect
            id="zotero-library-select"
            value={selectedGroupId}
            disabled={inFlight}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedGroupId(e.target.value)
            }
          >
            <option value="">My Library</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </OLFormSelect>
        )}
      </OLFormGroup>

      {error && <ErrorMessage error={error} />}
    </form>
  )
}
