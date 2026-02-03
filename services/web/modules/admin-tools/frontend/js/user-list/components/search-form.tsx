import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import * as eventTracking from '@/infrastructure/event-tracking'
import { isSmallDevice } from '@/infrastructure/event-tracking'
import OLCol from '@/shared/components/ol/ol-col'
import OLForm from '@/shared/components/ol/ol-form'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import MaterialIcon from '@/shared/components/material-icon'
import { MergeAndOverride } from '../../../../../../types/utils'
import { Filter } from '../context/user-list-context'

type SearchFormOwnProps = {
  inputValue: string
  setInputValue: (input: string) => void
  filter: Filter
}

type SearchFormProps = MergeAndOverride<
  React.ComponentProps<typeof OLForm>,
  SearchFormOwnProps
>

function SearchForm({
  inputValue,
  setInputValue,
  filter,
  className,
  ...props
}: SearchFormProps) {
  const { t } = useTranslation()
  const placeholder = t('search')+'…'

  const handleChange: React.ComponentProps<
    typeof OLFormControl
  >['onChange'] = e => {
    eventTracking.sendMB('admin-user-list-page-interaction', {
      action: 'search',
      isSmallDevice,
    })
    setInputValue(e.target.value)
  }

  const handleClear = () => setInputValue('')

  return (
    <OLForm
      className={classnames('user-search', className)}
      role="search"
      onSubmit={e => e.preventDefault()}
      {...props}
    >
      <OLFormGroup>
        <OLCol>
          <OLFormControl
            name="search"
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
