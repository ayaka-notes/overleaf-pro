import React, { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import OLRow from '@/shared/components/ol/ol-row'
import OLCol from '@/shared/components/ol/ol-col'
import OLCard from '@/shared/components/ol/ol-card'
import OLBadge from '@/shared/components/ol/ol-badge'
import { formatDate } from '@/utils/dates'
import UsersActionModal from './users-action-modal'
import { getAdditionalUserInfo } from '../../util/api'

type ShowUserInfoModalProps = Pick<
  React.ComponentProps<typeof UsersActionModal>,
  'users' | 'showModal' | 'handleCloseModal'
>

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <OLRow className="mb-2">
      <OLCol xs={4} className="fw-semibold text-muted">
        {label}
      </OLCol>
      <OLCol xs={8}>{value}</OLCol>
    </OLRow>
  )
}

function ShowUserInfoModal({
  users,
  showModal,
  handleCloseModal,
}: ShowUserInfoModalProps) {
  const { t } = useTranslation()

  if (users.length !== 1) return null
  const user = users[0]

  const [activationLink, setActivationLink] = useState<string | null>(null)
   const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!showModal) return

    getAdditionalUserInfo(user.id)
      .then(({ activationLink }) => {
        setActivationLink(activationLink)
      })
      .catch(() => {
        setActivationLink(null)
      })
  }, [showModal, user.id])

  const handleCopy = () => {
    if (!activationLink) return

    const markCopied = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(activationLink).then(markCopied)
      return
    }

    // fallback for older browsers
    const tempInput = document.createElement('input')
    tempInput.value = activationLink
    tempInput.style.position = 'fixed'
    tempInput.style.opacity = '0'
    document.body.appendChild(tempInput)
    tempInput.select()
    document.execCommand('copy')
    document.body.removeChild(tempInput)

    markCopied()
  }

  return (
    <UsersActionModal
      action="info"
      title={t('info')}
      showModal={showModal}
      handleCloseModal={handleCloseModal}
      users={users}
    >
      <OLCard className="mb-3">
        {(Body) => (
          <>
            <Card.Header>{t('Account')}</Card.Header>
            <Body>
              <InfoRow label={t('ID')} value={user.id} />
              <InfoRow label={t('email_address')} value={user.email} />
              <InfoRow label={t('first_name')} value={user.firstName || '—'} />
              <InfoRow label={t('last_name')} value={user.lastName || '—'} />

              {user.isAdmin && (
                <InfoRow
                  label={t('role')}
                  value={
                    <OLBadge bg="danger">
                      {t('admin')}
                    </OLBadge>
                  }
                />
              )}
              {activationLink && (
                <InfoRow 
                  label={t('activation_link')}
                  value={
                    <span
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={handleCopy}
                    >
                      {activationLink}
                      {copied && (
                        <span className="ms-2 text-success">
                          ({t('copied')})
                        </span>
                      )}
                    </span>
                  }
                />
              )}
            </Body>
          </>
        )}
      </OLCard>

      <OLCard>
        {(Body) => (
          <>
            <Card.Header>{t('user_activity')}</Card.Header>
            <Body>
              <InfoRow
                label={t('signed_up')}
                value={formatDate(user.signUpDate)}
              />
              <InfoRow
                label={t('last_logged_in')}
                value={
                  user.lastLoggedIn
                    ? formatDate(user.lastLoggedIn)
                    : t('never')
                }
              />
              <InfoRow
                label={t('last_active')}
                value={
                  user.lastActive
                    ? formatDate(user.lastActive)
                    : t('never')
                }
              />
              <InfoRow
                label={t('login_count')}
                value={user.loginCount}
              />
            </Body>
          </>
        )}
      </OLCard>
    </UsersActionModal>
  )
}

export default ShowUserInfoModal

