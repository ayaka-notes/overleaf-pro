import React from 'react'
import { useTranslation } from 'react-i18next'
import { DropdownItem } from '@/shared/components/dropdown/dropdown-menu'

export default function ImportFromGitHubMenu({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const { t } = useTranslation()
  return (
    <DropdownItem onClick={onClick}>
      {t('import_from_github')}
    </DropdownItem>
  )
}