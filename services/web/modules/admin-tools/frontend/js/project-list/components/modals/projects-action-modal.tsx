import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Project } from '../../../../../types/project/api'
import { getUserFacingMessage } from '@/infrastructure/fetch-json'
import useIsMounted from '@/shared/hooks/use-is-mounted'
import * as eventTracking from '@/infrastructure/event-tracking'
import { isSmallDevice } from '@/infrastructure/event-tracking'
import Notification from '@/shared/components/notification'
import OLButton from '@/shared/components/ol/ol-button'
import {
  OLModal,
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
} from '@/shared/components/ol/ol-modal'

type ProjectsActionModalProps = {
  title?: string
  action: 'transfer' | 'trash' | 'delete' | 'restore' | 'purge'
  actionHandler: (project: Project, options?: any) => Promise<void>
  handleCloseModal: () => void
  projects: Array<Project>
  showModal: boolean
  options?: any
  children?: React.ReactNode
}

const greenActions = new Set(['restore', 'transfer'])
const redActions = new Set(['trash', 'delete', 'purge'])

function ProjectsActionModal({
  title,
  action,
  actionHandler,
  handleCloseModal,
  showModal,
  projects,
  options,
  children,
}: ProjectsActionModalProps) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<Array<any>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const isMounted = useIsMounted()

  const variant =
    redActions.has(action) ? 'danger' :
    greenActions.has(action) ? 'primary' : 'secondary'

  const actionLabel =
    action === 'transfer' ? t('change_owner') :
    t(action)

  async function handleActionForProjects(projects: Array<Project>, options?: any) {
    const errored = []
    setIsProcessing(true)
    setErrors([])

    for (const project of projects) {
      try {
        await actionHandler(project, options)
      } catch (e) {
        errored.push({ projectName: project.name, error: e })
      }
    }

    if (isMounted.current) {
      setIsProcessing(false)
    }

    if (errored.length === 0) {
      handleCloseModal()
    } else {
      setErrors(errored)
    }
  }

  useEffect(() => {
    if (!showModal) {
      setErrors([])
      setIsProcessing(false)
    }
  }, [showModal])

  useEffect(() => {
    if (options) {
      setErrors([])
    }
  }, [options])
  
  useEffect(() => {
    if (showModal) {
      eventTracking.sendMB('admin-user-project-list-page-interaction', {
        action,
        isSmallDevice,
      })
    }
  }, [action, showModal])

  return (
    <OLModal
      animation
      show={showModal}
      onHide={handleCloseModal}
      id="admin-action-project-modal"
      backdrop="static"
    >
      <OLModalHeader>
        <OLModalTitle>{title}</OLModalTitle>
      </OLModalHeader>
      <OLModalBody>
        {children}
        {!isProcessing &&
          errors.length > 0 &&
          errors.map((error, i) => (
            <div className="notification-list" key={i}>
              <Notification
                type="error"
                title={error.projectName}
                content={getUserFacingMessage(error.error) as string}
              />
            </div>
          ))}
      </OLModalBody>
      <OLModalFooter>
        <OLButton variant="secondary" onClick={handleCloseModal}>
          {t('cancel')}
        </OLButton>
        <OLButton
          variant={variant}
          onClick={() => handleActionForProjects(projects, options)}
          disabled={isProcessing}
        >
          {actionLabel}
        </OLButton>
      </OLModalFooter>
    </OLModal>
  )
}

export default memo(ProjectsActionModal)
