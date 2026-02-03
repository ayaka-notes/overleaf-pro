import { useTranslation } from 'react-i18next'
import * as eventTracking from '@/infrastructure/event-tracking'
import classnames from 'classnames'
import { MergeAndOverride } from '../../../../../../types/utils'
import { isSmallDevice } from '@/infrastructure/event-tracking'
import OLForm from '@/shared/components/ol/ol-form'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLCol from '@/shared/components/ol/ol-col'
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

function SearchForm({
  inputValue,
  setInputValue,
  className,
  ...props
}: SearchFormProps) {
  const { t } = useTranslation()
  const placeholderMessage = t('search_projects')
  const placeholder = `${placeholderMessage}…`

  const handleChange: React.ComponentProps<
    typeof OLFormControl
  >['onChange'] = e => {
    eventTracking.sendMB('admin-user-project-list-page-interaction', {
      action: 'search',
      isSmallDevice,
    })
    setInputValue(e.target.value)
  }

  const handleClear = () => setInputValue('')

  return (
    <OLForm
      className={classnames('project-search', className)}
      role="search"
      onSubmit={e => e.preventDefault()}
      {...props}
    >
      <OLFormGroup>
        <OLCol>
          <OLFormControl
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
        </OLCol>
      </OLFormGroup>
    </OLForm>
  )
}

export default SearchForm
