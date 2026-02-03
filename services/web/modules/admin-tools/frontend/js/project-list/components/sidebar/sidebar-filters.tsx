import { useTranslation } from 'react-i18next'
import {
  Filter,
  useProjectListContext,
} from '../../context/project-list-context'
import ProjectsFilterMenu from '../projects-filter-menu'

type SidebarFilterProps = {
  filter: Filter
  text: React.ReactNode
}

export function SidebarFilter({ filter, text }: SidebarFilterProps) {
  const { selectFilter } = useProjectListContext()

  return (
    <ProjectsFilterMenu filter={filter}>
      {isActive => (
        <li className={isActive ? 'active' : ''}>
          <button type="button" onClick={() => selectFilter(filter)}>
            {text}
          </button>
        </li>
      )}
    </ProjectsFilterMenu>
  )
}

export default function SidebarFilters() {
  const { t } = useTranslation()

  return (
    <ul className="list-unstyled project-list-filters">
      <SidebarFilter filter="owned" text={t('all_projects')} />
      <SidebarFilter filter="inactive" text={t('archived_projects')} />
      <SidebarFilter filter="trashed" text={t('trashed_projects')} />
      <SidebarFilter filter="deleted" text={t('delete_projects')} />
      <li aria-hidden="true">
        <hr />
      </li>
    </ul>
  )
}
