import { useTranslation, Trans } from 'react-i18next'
import OLNotification from '@/shared/components/ol/ol-notification'
import {
  OLModalBody,
  OLModalFooter,
} from '@/shared/components/ol/ol-modal'
import OLButton from '@/shared/components/ol/ol-button'
import { ProjectSyncState } from '../../types/git-sync-types'

type GitSyncCannotExportModalProps = {
  projectSyncState: ProjectSyncState
  handleHide: () => void
}

const GitSyncCannotExportModal = ({ projectSyncState, handleHide }: GitSyncCannotExportModalProps) => {
  const { t } = useTranslation()
  return (
    <>
      <OLModalBody>
        <OLNotification
          type="warning"
          content={(
            <Trans
              i18nKey="only_project_owner_can_link_github"
              values={{
                projectOwnerEmail: projectSyncState.ownerEmail ?? '?',
              }}
              components={[
                projectSyncState.ownerEmail ? <a href={`mailto:${projectSyncState.ownerEmail}`} /> : <></>
              ]}
            />
          )}
        />
      </OLModalBody>
      <OLModalFooter>
        <OLButton
          variant="secondary"
          onClick={handleHide}
        >
          {t('close')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}

export default GitSyncCannotExportModal
