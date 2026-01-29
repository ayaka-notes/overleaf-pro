import { useTranslation } from 'react-i18next'
import { MergeAndOverride } from '../../../../../types/utils'
import OLForm from '@/shared/components/ol/ol-form'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import MaterialIcon from '@/shared/components/material-icon'

type SearchFormOwnProps = {
  inputValue: string
  setInputValue: (input: string) => void
}

type SearchFormProps = MergeAndOverride<
  React.ComponentProps<typeof OLForm>,
  SearchFormOwnProps
>

export default function SearchForm({
  inputValue,
  setInputValue,
}: SearchFormProps) {
  const { t } = useTranslation()
  let placeholderMessage = t('search')
  const placeholder = `${placeholderMessage}…`

  const handleChange: React.ComponentProps<typeof OLFormControl
  >['onChange'] = e => {
    setInputValue(e.target.value)
  }

  const handleClear = () => setInputValue('')

  return (
    <OLForm
      role="search"
      onSubmit={e => e.preventDefault()}
    >
      <OLFormControl
        className="gallery-search-form-control"
        id="gallery-search-form-control"
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        prepend={<MaterialIcon type="search" />}
        append={
          inputValue.length > 0 && (
            <button
              type="button"
              className="form-control-search-clear-btn"
              aria-label={t('clear_search')}
              onClick={handleClear}
            >
              <MaterialIcon type="clear" />
            </button>
          )
        }
      />
    </OLForm>
  )
}
