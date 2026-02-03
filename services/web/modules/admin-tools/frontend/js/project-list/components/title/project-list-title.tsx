import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { Filter } from '../../context/project-list-context'

function ProjectListTitle({
  filter,
  className,
}: {
  filter: Filter
  className?: string
}) {
  const { t } = useTranslation()
  let message = t('projects')
  let extraProps = {}

  switch (filter) {
    case 'owned':
      message = t('all_projects')
      break
    case 'inactive':
      message = t('archived_projects')
      break
    case 'trashed':
      message = t('trashed_projects')
      break
    case 'deleted':
      message = t('delete_projects')
      break
  }

  return (
    <h1
      id="main-content"
      tabIndex={-1}
      className={classnames('project-list-title', className)}
      {...extraProps}
    >
      {message}
    </h1>
  )
}

export default ProjectListTitle
