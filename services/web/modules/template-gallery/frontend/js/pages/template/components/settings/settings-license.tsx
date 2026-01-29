import { useTranslation } from 'react-i18next'
import SettingsMenuSelect from './settings-menu-select'
import type { Option } from './settings-menu-select'

export const licensesMap = {
  'cc_by_4.0': 'Creative Commons CC BY 4.0',
  'lppl_1.3c': 'LaTeX Project Public License 1.3c',
  'other': 'Other (as stated in the work)',
}

interface SettingsLicenseProps {
  value: string
  onChange: (value: string) => void
}

export default function SettingsLicense({
  value,
  onChange,
}: SettingsLicenseProps) {
  const { t } = useTranslation()

  const options = Object.entries(licensesMap).map(([value, label]) => ({ value, label }))

  return (
    <SettingsMenuSelect
      name="license"
      label={t('license')}
      value={value}
      onChange={onChange}
      options={options}
    />
  )
}
