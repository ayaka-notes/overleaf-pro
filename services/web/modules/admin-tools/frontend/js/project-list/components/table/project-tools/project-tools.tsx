import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjectListContext } from '../../../context/project-list-context'
import TransferProjectsButton from './buttons/transfer-projects-button'
import DownloadProjectsButton from './buttons/download-projects-button'
import TrashProjectsButton from './buttons/trash-projects-button'
import UntrashProjectsButton from './buttons/untrash-projects-button'
import DeleteProjectsButton from './buttons/delete-projects-button'
import RestoreProjectsButton from './buttons/restore-projects-button'
import PurgeProjectsButton from './buttons/purge-projects-button'
import OLButtonToolbar from '@/shared/components/ol/ol-button-toolbar'
import OLButtonGroup from '@/shared/components/ol/ol-button-group'

function ProjectTools() {
  const { t } = useTranslation()
  const { filter } = useProjectListContext()

  return (
    <OLButtonToolbar aria-label={t('toolbar_selected_projects')}>
      <OLButtonGroup
        aria-label={t('toolbar_selected_projects_management_actions')}
      >
        {filter !== 'deleted' && <DownloadProjectsButton />}
        {filter !== 'deleted' && <TransferProjectsButton />}
        {filter !== 'deleted' && filter !== 'trashed' && <TrashProjectsButton />}
        {filter === 'trashed' && <UntrashProjectsButton />}
      </OLButtonGroup>
      {filter === 'trashed' && (
        <OLButtonGroup aria-label={t('toolbar_selected_projects_remove')}>
          <DeleteProjectsButton />
        </OLButtonGroup>
      )}

      {(filter === 'deleted') && (
        <>
          <OLButtonGroup
            aria-label={t('toolbar_selected_projects_restore')}
          >
            <RestoreProjectsButton />
          </OLButtonGroup>
          <OLButtonGroup
            aria-label={t('toolbar_selected_projects_purge')}
          >
            <PurgeProjectsButton />
          </OLButtonGroup>
        </>
      )}
    </OLButtonToolbar>
  )
}

export default memo(ProjectTools)
