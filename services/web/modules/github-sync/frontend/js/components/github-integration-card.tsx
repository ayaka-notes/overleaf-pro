
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import GithubLogo from '@/shared/svgs/github-logo'
import { useProjectContext } from '@/shared/context/project-context'
import IntegrationCard from '@/features/ide-redesign/components/integrations-panel/integration-card'
import {
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
  OLModal,
} from '@/shared/components/ol/ol-modal'
import OLButton from '@/shared/components/ol/ol-button'
import OLForm from '@/shared/components/ol/ol-form'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import OLFormLabel from '@/shared/components/ol/ol-form-label'
import OLFormCheckbox from '@/shared/components/ol/ol-form-checkbox'
import OLFormSelect from '@/shared/components/ol/ol-form-select'

import OLRow from '@/shared/components/ol/ol-row'
import OLCol from '@/shared/components/ol/ol-col'
import {
  getJSON,
  postJSON
} from '../../../../../frontend/js/infrastructure/fetch-json'
import getMeta from '@/utils/meta'
import OLNotification from '@/shared/components/ol/ol-notification'
import { useEditorManagerContext } from '@/features/ide-react/context/editor-manager-context'
import { Trans } from 'react-i18next'


type GitHubSyncModalStatus = 'loading' | 'export' | 'merge' | 'pushSubmit' | 'syncing' | 'conflict' | 'need-auth'

type GitHubSyncModalNeedAuthProps = {
  handleHide: () => void
}

const GitHubSyncModalNeedAuth = ({ handleHide }: GitHubSyncModalNeedAuthProps) => {
  const { t } = useTranslation()
  const { appName } = getMeta('ol-ExposedSettings')
  return (
    <>
      <OLModalBody>
        <p>{t('link_to_github_description', { appName })}</p>
      </OLModalBody>
      <OLModalFooter>
        <OLButton
          variant="secondary"
          onClick={handleHide}
        >
          {t('close')}
        </OLButton>

        <OLButton
          variant="primary"
          onClick={() => {
            window.open(
              '/github-sync/beginAuth',
              'githubAuth',
              'width=600,height=700'
            )
          }}
        >
          {t('link_to_github')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}

type GitHubSyncModalSyncingProps = {
  handleHide: () => void
  modalStatus: GitHubSyncModalStatus
  setModalStatus: (modalStatus: GitHubSyncModalStatus) => void
  commitMessage: string
  projectId: string
}

const GitHubSyncModalSyncing = ({
  handleHide, modalStatus, setModalStatus,
  commitMessage, projectId
}: GitHubSyncModalSyncingProps) => {
  const { t } = useTranslation()
  const { setIgnoringExternalUpdates } = useEditorManagerContext()

  // launch syncing when this component is rendered
  useEffect(() => {
    let cancelled = false

    const syncProjectWithGitHub = async () => {
      setIgnoringExternalUpdates(true)
      try {
        // call backend to start syncing process, endpoint: /project/<project_id>/github-sync/sync
        await postJSON(`/project/${projectId}/github-sync/merge`, {
          body: {
            message: commitMessage,
          },
        })
        // after syncing is done, we can set modal status to loading to fetch latest status and show merge table if needed.
        if (!cancelled)
          setModalStatus('loading')
      } catch (err) {
        console.error('Failed to sync project with GitHub', err)
        // if error occurs, we can set modal status to merge to show pull/push table, user can decide how to resolve the conflict.
        if (!cancelled)
          setModalStatus('loading')
      } finally {
        setIgnoringExternalUpdates(false)
      }
    }

    if (modalStatus === 'syncing') syncProjectWithGitHub()

    return () => {
      cancelled = true
      setIgnoringExternalUpdates(false)
    }
  }, [modalStatus, projectId, commitMessage, setModalStatus, setIgnoringExternalUpdates])


  return (
    <>
      <OLModalBody>
        <div role="status" className="loading align-items-start">
          <div aria-hidden="true" data-testid="ol-spinner" className="spinner-border spinner-border-sm"></div>
          {t('importing_and_merging_changes_in_github')}
        </div>
      </OLModalBody>
      <OLModalFooter>
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

type GithubSyncModalLoadingProps = {
  handleHide: () => void
}
const GithubSyncModalLoading = ({ handleHide }: GithubSyncModalLoadingProps) => {
  const { t } = useTranslation()
  return (
    <>
      <OLModalBody>
        <div role="status" className="loading align-items-start">
          <div aria-hidden="true" data-testid="ol-spinner" className="spinner-border spinner-border-sm"></div>
          {t('checking_project_github_status')}
        </div>
      </OLModalBody>
      <OLModalFooter>
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

type GithubSyncModalExportingProps = {
  handleHide: () => void
  handleSetModalState: (modalStatus: GitHubSyncModalStatus) => void
}
const GithubSyncModalExporting = ({ handleHide, handleSetModalState }: GithubSyncModalExportingProps) => {
  const { t } = useTranslation()
  const [orgs, setOrgs] = useState<string[]>([])
  const [user, setUser] = useState<string>('')
  const [selectedOwner, setSelectedOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [isSubmitError, setIsSubmitError] = useState(false)
  const { project } = useProjectContext()

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await getJSON<string[]>('/user/github-sync/orgs')
        if (data.user) {
          setUser(data.user.login)
          setSelectedOwner(data.user.login)
        }
        if (data.orgs) {
          setOrgs(data.orgs.map((org: any) => org.login))
        }
      } catch (err: any) {
        console.error('Failed to fetch GitHub orgs', err)
      }
    }

    fetchOrgs()
  }, [])

  const handlerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitLoading(true)
    // Interface with backend
    // Endpoint: /project/<project_id>/github-sync/export

    // description: "repoDescription"
    // name: "repoName"
    // private: true
    // org: "test-org" (Optional, if not set, use user's)
    const exportRepo = async () => {
      try {
        await postJSON(`/project/${project?._id}/github-sync/export`, {
          body: {
            name: repoName,
            description,
            private: visibility === 'private',
            org: selectedOwner === user ? undefined : selectedOwner,
          },
        })
        // After successful export, we should set modal status to loading.

        setSubmitLoading(false)
        handleSetModalState('loading')
      } catch (err: any) {
        console.error('Failed to export project to GitHub', err)
        setSubmitLoading(false)
        setIsSubmitError(true)
      }
    }

    exportRepo()
  }

  return (
    <>
      <OLModalBody>
        <h4>{t('export_project_to_github')}</h4>
        <p>{t('project_not_linked_to_github')}</p>
        {
          isSubmitError && (
            <OLNotification
              type="error"
              content={t('github_validation_check')}
            />
          )
        }
        <OLForm>
          <OLRow>
            <OLCol md={4}>
              <OLFormGroup>
                <OLFormLabel htmlFor="github-sync-owner">
                  {t('owner')}
                </OLFormLabel>
                <OLFormSelect
                  as="select"
                  id="github-sync-owner"
                  name="org"
                  value={selectedOwner}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedOwner(e.target.value)
                  }
                >
                  <option key={user} value={user}>
                    {user}
                  </option>
                  {orgs.map(org => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </OLFormSelect>
              </OLFormGroup>
            </OLCol>

            <OLCol md={5}>
              <OLFormGroup>
                <OLFormLabel htmlFor="github-sync-name">
                  {t('repository_name')}
                </OLFormLabel>
                <OLFormControl
                  id="github-sync-name"
                  name="name"
                  type="text"
                  value={repoName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRepoName(e.target.value)
                  }
                />
              </OLFormGroup>
            </OLCol>
          </OLRow>

          <OLRow>
            <OLCol md={12}>
              <OLFormGroup>
                <OLFormLabel htmlFor="github-sync-description">
                  {t('description')} ({t('optional')})
                </OLFormLabel>
                <OLFormControl
                  id="github-sync-description"
                  name="description"
                  type="text"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(e.target.value)
                  }
                />
              </OLFormGroup>
            </OLCol>
          </OLRow>

          <hr />

          <fieldset>
            <legend className="visually-hidden">
              {t('repository_visibility')}
            </legend>

            <OLFormGroup>
              <OLRow>
                <OLCol md={12}>
                  <OLFormCheckbox
                    type="radio"
                    id="public"
                    name="repository"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    label={t('public', { defaultValue: 'Public' })}
                    description={t('github_public_description')}
                  />
                </OLCol>
              </OLRow>
            </OLFormGroup>

            <OLFormGroup>
              <OLRow>
                <OLCol md={12}>
                  <OLFormCheckbox
                    type="radio"
                    id="private"
                    name="repository"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    label={t('private', { defaultValue: 'Private' })}
                    description={t('github_private_description')}
                  />
                </OLCol>
              </OLRow>
            </OLFormGroup>
          </fieldset>
        </OLForm>
      </OLModalBody>
      <OLModalFooter>
        <OLButton
          variant="secondary"
          onClick={handleHide}
        >
          {t('cancel')}
        </OLButton>
        <OLButton
          variant="primary"
          onClick={handlerSubmit}
          isLoading={submitLoading}
        >
          {t('create_project_in_github')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}


type GithubSyncModalMergingProps = {
  handleHide: () => void
  setModalStatus: (modalStatus: GitHubSyncModalStatus) => void
  projectSyncStatus: any
  projectId: string
  // other props to show conflict and allow user to resolve conflict
}

const GithubSyncModalMerging = ({
  handleHide, setModalStatus, projectSyncStatus, projectId
}: GithubSyncModalMergingProps) => {
  const { t } = useTranslation()
  const { appName } = getMeta('ol-ExposedSettings')
  const [unmergedCommits, setUnmergedCommits] = useState<any[]>([])
  const [isLoadingCommits, setIsLoadingCommits] = useState(true)

  useEffect(() => {
    const fetchUnmergedCommits = async () => {
      try {
        const data = await getJSON(`/project/${projectId}/github-sync/commits/unmerged`)
        setUnmergedCommits(data.commits)
        setIsLoadingCommits(false)
      } catch (err) {
        console.error('Failed to fetch unmerged commits', err)
        setIsLoadingCommits(false)
      }
    }
    fetchUnmergedCommits()
  }, [])

  if (isLoadingCommits) {
    return (
      <>
        <OLModalBody>
          <div role="status" className="loading align-items-start">
            <div aria-hidden="true" data-testid="ol-spinner" className="spinner-border spinner-border-sm"></div>
            {t('checking_project_github_status')}
          </div>
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


  return (
    <>
      <OLModalBody>
        <p className="text-center">{t('project_linked_to')}:
          <a href={`https://github.com/${projectSyncStatus.repo}`} target="_blank" rel="noopener noreferrer">
            {projectSyncStatus.repo}
          </a>
        </p>
        <hr></hr>

        {unmergedCommits.length === 0 &&
          <div className="text-center commit-message">
            <p>{t('no_new_commits_in_github')}</p>
          </div>
        }

        {unmergedCommits.length > 0 &&
          <>
            <h3>
              {t('recent_commits_in_github')}
            </h3>
            <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '1em' }}>
              {unmergedCommits.map((commit: any) => (
                <div id={commit.sha}>
                  <span className="small float-end">
                    <a href={`https://github.com/${projectSyncStatus.repo}/commit/${commit.sha}`}
                      target="_blank" rel="noreferrer noopener">
                      {commit.sha.substring(0, 7)}
                    </a>
                  </span>
                  <a href={`https://github.com/${projectSyncStatus.repo}/commit/${commit.sha}`}
                    target="_blank" className="commit-message" rel="noreferrer noopener">
                    {commit.message}
                  </a>
                  <div className="small">by {commit.author.name} &lt;{commit.author.email}&gt;</div>
                </div>
                // <p key={commit.sha}>{commit.message}</p>
              ))}
            </div>

          </>
        }
        <p className="text-center row-spaced">
          <OLButton
            variant="secondary"
            leadingIcon="arrow_downward"
            onClick={() => setModalStatus('syncing')}
          >
            {t('pull_github_changes_into_sharelatex', { appName })}
          </OLButton>
        </p>
        <hr></hr>
        <p className="text-center">
          <OLButton
            variant="secondary"
            leadingIcon="arrow_upward"
            onClick={() => setModalStatus('pushSubmit')}
          >
            {t('push_sharelatex_changes_to_github', { appName })}
          </OLButton>
        </p>


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


type GitHubSyncModalPushSubmitProps = {
  handleHide: () => void
  // other props to show commit message input and submit button
  commitMessage: string
  setCommitMessage: (message: string) => void
  setModalStatus: (modalStatus: GitHubSyncModalStatus) => void
}

const GitHubSyncModalPushSubmit = ({
  handleHide, commitMessage, setCommitMessage, setModalStatus
}: GitHubSyncModalPushSubmitProps) => {
  const { t } = useTranslation()
  const { appName } = getMeta('ol-ExposedSettings')

  return (
    <>
      <OLModalBody>
        <OLForm>
          <p>{t('sync_project_to_github_explanation', { appName })}</p>
          <OLFormGroup>
            <OLFormControl
              as="textarea"
              rows={2}
              placeholder={t('github_commit_message_placeholder', { appName })}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
          </OLFormGroup>
        </OLForm>
      </OLModalBody>
      <OLModalFooter>
        <OLButton
          variant="secondary"
          onClick={handleHide}
        >
          {t('cancel')}
        </OLButton>
        <OLButton
          variant="primary"
          onClick={() => {
            setModalStatus('syncing')
          }}
        >
          {t('sync')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}

type GitHubSyncModalConflictProps = {
  // props to show conflict and allow user to resolve conflict
  projectSyncStatus: any
  handleHide: () => void
  setModalStatus: (modalStatus: GitHubSyncModalStatus) => void
}

const GitHubSyncModalConflict = ({ projectSyncStatus, handleHide, setModalStatus }: GitHubSyncModalConflictProps) => {
  const { t } = useTranslation()
  const { appName } = getMeta('ol-ExposedSettings')

  return (
    <>
      <OLModalBody>
        <OLNotification
          type="error"
          content={"Your changes in Overleaf and GitHub could not be automatically merged."}
        />
        <p className="mt-2">
          <Trans
            i18nKey="github_merge_failed"
            values={{ appName, sharelatex_branch: projectSyncStatus.unmerged_branch }}
            components={[<b />]}
          />
        </p>
      </OLModalBody>
      <OLModalFooter>
        <OLButton
          variant="secondary"
          onClick={handleHide}
        >
          {t('close')}
        </OLButton>
        <OLButton
          variant="primary"
          onClick={
            () => setModalStatus('pushSubmit')
          }
        >
          {t('continue_github_merge')}
        </OLButton>
      </OLModalFooter>
    </>
  )
}

type GitHubSyncModalProps = {
  show: boolean
  handleHide: () => void
  projectId: string
  modalStatus: GitHubSyncModalStatus
  setModalStatus: (modalStatus: GitHubSyncModalStatus) => void
}

// 0. Check project github sync status 
//    Show spinner while loading, show error message if error occurs
// 1. If /project/<project_ID>/github-sync/status 
//    returns {enabled: false} then show export Github table
//        a) export Github table will check /user/github-sync/orgs
//        b) once user submits export, spinner in button
//        c) if export is successful, return to step 0, to reload status.
// 2. If /project/<project_ID>/github-sync/status 
//    returns {enabled: true, merge_status: 'success'}
//    then show pull/push table
//        a) check /project/<project_ID>/github-sync/commits/unmerged
//        b) if there are unmerged commits, show pull button
//        c) push button should always be shown
// 3. If /project/<project_ID>/github-sync/status
//    returns {enabled: true, merge_status: 'conflict'}
//    then show conflict resolution contents.
//        a) user can choose to merge confict in github, and submit 
//           remerge form overleaf.
function GitHubSyncModal({
  show, handleHide, projectId, modalStatus, setModalStatus
}: GitHubSyncModalProps) {
  const { t } = useTranslation()
  const { project } = useProjectContext()

  const [projectSyncStatus, setProjectSyncStatus] = useState<any>(null)


  // since we need to switch to syncing component when user clicks pull or push,
  // we need to pass this var
  const [commitMessage, setCommitMessage] = useState('')

  // If modalStatus is loading, we will fetch status
  useEffect(() => {
    if (!show || !project || modalStatus !== 'loading') {
      return
    }

    const fetchUserGitHubSyncStatus = async () => {
      try {
        const data = await getJSON('/user/github-sync/status')
        if (data.enabled) {
          // fetch project github sync status
          const projectStatus = await getJSON(`/project/${projectId}/github-sync/status`)
          if (projectStatus.enabled && projectStatus.merge_status === 'success') {
            setModalStatus('merge')
            setProjectSyncStatus(projectStatus)
          } else if (projectStatus.enabled && projectStatus.merge_status === 'failure') {
            setModalStatus('conflict')
            setProjectSyncStatus(projectStatus)
          } else {
            setModalStatus('export')
          }
        } else {
          setModalStatus('need-auth')
        }
      } catch (err: any) {
        console.error('Failed to fetch GitHub sync status', err)
      }
    }

    // const fetchGitHubSyncStatus = async () => {
    //   try {
    //     const data = await getJSON(`/project/${projectId}/github-sync/status`)
    //     if (data.enabled && data.merge_status === 'success') {
    //       setModalStatus('merge')
    //       setProjectSyncStatus(data)
    //     } else if (data.enabled && data.merge_status === 'failure') {
    //       setModalStatus('conflict')
    //       setProjectSyncStatus(data)
    //     }
    //     else {
    //       setModalStatus('export')
    //     }
    //   } catch (err: any) {
    //     console.error('Failed to fetch GitHub sync status', err)
    //   }
    // }

    fetchUserGitHubSyncStatus()
  }, [show, modalStatus])



  useEffect(() => {
    if (!show)
      setCommitMessage('')
  }, [show])

  return (
    <OLModal show={show} onHide={handleHide} size="lg" backdrop="static" initialFocus={false} enforceFocus={false}>
      <OLModalHeader closeButton>
        <OLModalTitle>{t('github_sync')}</OLModalTitle>
      </OLModalHeader>
      {modalStatus === 'loading' && <GithubSyncModalLoading handleHide={handleHide} />}
      {modalStatus === 'export' && <GithubSyncModalExporting handleHide={handleHide} handleSetModalState={setModalStatus} />}
      {modalStatus === 'merge' && <GithubSyncModalMerging
        handleHide={handleHide} setModalStatus={setModalStatus}
        projectSyncStatus={projectSyncStatus} projectId={projectId}
      />
      }
      {modalStatus === 'pushSubmit' && <GitHubSyncModalPushSubmit
        handleHide={handleHide} commitMessage={commitMessage}
        setCommitMessage={setCommitMessage}
        setModalStatus={setModalStatus}
      />}
      {modalStatus === 'syncing' && <GitHubSyncModalSyncing
        handleHide={handleHide} modalStatus={modalStatus}
        setModalStatus={setModalStatus} commitMessage={commitMessage}
        projectId={projectId}
      />}
      {
        modalStatus === 'conflict' && <GitHubSyncModalConflict
          projectSyncStatus={projectSyncStatus}
          handleHide={handleHide}
          setModalStatus={setModalStatus}
        />
      }
      {
        modalStatus === 'need-auth' && <GitHubSyncModalNeedAuth handleHide={handleHide} />
      }

    </OLModal >
  )
}




const GitHubSyncCard = () => {
  const { t } = useTranslation()

  const [showGithubSyncModal, setShowGithubSyncModal] = useState(false)
  const { project, tags: projectTags } = useProjectContext()

  // loading: checking github sync status
  // export: show export table to link github repo
  // merge: show remote changes from github and allow user to pull/push
  // pushSubmit: allow user to fill submit message
  // syncing: show syncing spinner while request is being processed
  const [modalStatus, setModalStatus] = useState<GitHubSyncModalStatus>('loading')

  return (
    <>
      <IntegrationCard
        title={t('github')}
        description={t('sync_with_a_github_repository')}
        icon={<GithubLogo size={32} />}
        showPaywallBadge={false}
        onClick={() => setShowGithubSyncModal(true)}
      >
      </IntegrationCard>
      <GitHubSyncModal
        show={showGithubSyncModal}
        modalStatus={modalStatus}
        setModalStatus={setModalStatus}
        handleHide={() => {
          setShowGithubSyncModal(false)
          setModalStatus('loading')
        }}
        projectId={project?._id || ''}
      />
    </>
  )
}

export default GitHubSyncCard
