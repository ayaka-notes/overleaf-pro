import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import getMeta from '@/utils/meta'
import { debugConsole } from '@/utils/debugging'
import useAsync from '@/shared/hooks/use-async'
import usePersistedState from '@/shared/hooks/use-persisted-state'
import {
  GetProjectsResponseBody,
  Project,
  Sort,
} from '../../../../types/project/api'
import { getProjects, searchProjects } from '../util/api'
import { useUserIdentityContext } from '../../user-list/context/user-identity-context'
import sortProjects from '../util/sort-projects'

const MAX_PROJECT_PER_PAGE = 20

export type Filter = 'owned' | 'trashed' | 'deleted' | 'inactive'

type FilterMap = {
  [key in Filter]: Partial<Project> | ((project: Project) => boolean)
}

const filters: FilterMap = {
  owned: (project) =>
    project.deleted === false &&
    project.trashed === false &&
    project.owner != null,

  trashed: (project) =>
    project.deleted === false &&
    project.trashed === true &&
    project.owner != null,

  deleted: (project) =>
    project.deleted === true,

  inactive: (project) =>
    project.deleted === false &&
    project.trashed === false &&
    project.inactive === true,
}

export type ProjectListContextValue = {
  error: Error | null
  filter: Filter
  hiddenProjectsCount: number
  isLoading: ReturnType<typeof useAsync>['isLoading']
  loadMoreCount: number
  loadMoreProjects: () => void
  loadProgress: number
  removeProjectFromView: (project: Project) => void
  selectFilter: (filter: Filter) => void
  selectedProjectIds: Set<string>
  selectedProjects: Project[]
  selectOrUnselectAllProjects: React.Dispatch<React.SetStateAction<boolean>>
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
  setSelectedProjectIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setSort: React.Dispatch<React.SetStateAction<Sort>>
  showAllProjects: () => void
  sort: Sort
  toggleSelectedProject: (projectId: string, selected?: boolean) => void
  totalProjectsCount: number
  projectsOwnerId: string | null
  updateProjectViewData: (newProjectData: Project) => void
  visibleProjects: Project[]
}

export const ProjectListContext = createContext<
  ProjectListContextValue | undefined
>(undefined)

type ProjectListProviderProps = {
  projectsOwnerId: string | null
  children: ReactNode
}

export function ProjectListProvider({ projectsOwnerId, children }: ProjectListProviderProps) {
  const { getUserById } = useUserIdentityContext()

  const prefetchedProjectsBlob = projectsOwnerId ? null : getMeta('ol-prefetchedProjectsBlob')
  const [loadedProjects, setLoadedProjects] = useState<Project[]>(
    prefetchedProjectsBlob?.projects ?? []
  )

  const [maxVisibleProjects, setMaxVisibleProjects] =
    useState(MAX_PROJECT_PER_PAGE)

  const [loadProgress, setLoadProgress] = useState(
    prefetchedProjectsBlob ? 100 : 20
  )

  const [totalProjectsCount, setTotalProjectsCount] = useState<number>(
    prefetchedProjectsBlob?.totalSize ?? 0
  )

  const [filter, setFilter] = usePersistedState<Filter>(
    'admin-project-list-filter',
    'owned'
  )
  const [sort, setSort] = useState<Sort>({
    by: filter === 'deleted' ? 'deletedAt' : 'lastUpdated',
    order: 'desc',
  })
  const prevSortRef = useRef<Sort>(sort)

  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<Project[] | null>(null)

  const {
    isLoading: loading,
    isIdle,
    error,
    runAsync,
  } = useAsync<GetProjectsResponseBody>({
    status: prefetchedProjectsBlob ? 'resolved' : 'pending',
    data: prefetchedProjectsBlob,
  })

  const isLoading = isIdle ? true : loading

  useEffect(() => {
    if (prefetchedProjectsBlob) return

    setLoadProgress(40)

    runAsync(getProjects({ userId: projectsOwnerId, by: 'lastUpdated', order: 'desc' }))
      .then(data => {
        setLoadedProjects(data.projects)
        setTotalProjectsCount(data.totalSize)
      })
      .catch(debugConsole.error)
      .finally(() => {
        setLoadProgress(100)
      })
  }, [projectsOwnerId, runAsync, prefetchedProjectsBlob])

  useEffect(() => {
    if (searchText.length === 0) {
      setSearchResults(null)
      return
    }
    const abortController = new AbortController()
    const timer = setTimeout(() => {
      searchProjects(searchText, projectsOwnerId, abortController.signal)
        .then(data => {
          setSearchResults(data.projects)
        })
        .catch(error => {
          if (error.name === 'AbortError') {
            debugConsole.log('Search aborted')
            return
          }
          debugConsole.error('Error searching projects:', error)
          setSearchResults(null)
        })
    }, 500)
    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [searchText])

  const sortedProjects = useMemo(() => {
    if (prevSortRef.current === sort) return loadedProjects

    const sorted = sortProjects(loadedProjects, sort, getUserById)
    prevSortRef.current = sort
    return sorted
  }, [loadedProjects, sort, getUserById])

  const filteredProjects = useMemo(() => {
    let result = searchResults !== null ? searchResults : sortedProjects
    result = result.filter(filters[filter])
    return sortProjects(result, sort, getUserById)
  }, [sortedProjects, searchResults, filter])

  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, maxVisibleProjects)
  }, [filteredProjects, maxVisibleProjects])

  const hiddenProjectsCount = Math.max(
    filteredProjects.length - visibleProjects.length,
    0
  )

  const loadMoreCount = Math.min(
    hiddenProjectsCount,
    MAX_PROJECT_PER_PAGE
  )

  const showAllProjects = useCallback(() => {
    setMaxVisibleProjects(v => v + hiddenProjectsCount)
  }, [hiddenProjectsCount])

  const loadMoreProjects = useCallback(() => {
    setMaxVisibleProjects(v => v + loadMoreCount)
  }, [maxVisibleProjects])

  const [selectedProjectIds, setSelectedProjectIds] = useState(
    () => new Set<string>()
  )

  const toggleSelectedProject = useCallback(
    (projectId: string, selected?: boolean) => {
      setSelectedProjectIds(prevSelectedProjectIds => {
        const selectedProjectIds = new Set(prevSelectedProjectIds)
        if (selected === true) {
          selectedProjectIds.add(projectId)
        } else if (selected === false) {
          selectedProjectIds.delete(projectId)
        } else if (selectedProjectIds.has(projectId)) {
          selectedProjectIds.delete(projectId)
        } else {
          selectedProjectIds.add(projectId)
        }
        return selectedProjectIds
      })
    },
    []
  )

  const selectedProjects = useMemo(() => {
    return visibleProjects.filter(project => selectedProjectIds.has(project.id))
  }, [selectedProjectIds, visibleProjects])


  const selectOrUnselectAllProjects = useCallback(
    (checked: any) => {
      setSelectedProjectIds(prevSelectedProjectIds => {
        const selectedProjectIds = new Set(prevSelectedProjectIds)
        for (const project of visibleProjects) {
          if (checked) {
            selectedProjectIds.add(project.id)
          } else {
            selectedProjectIds.delete(project.id)
          }
        }
        return selectedProjectIds
      })
    },
    [visibleProjects]
  )

  const selectFilter = useCallback(
    (filter: Filter) => {
      setFilter(filter)

      setSort(prev => {
        if (filter === 'deleted' && prev.by === 'lastUpdated') {
          return { ...prev, by: 'deletedAt' }
        }
        if (filter !== 'deleted' && prev.by === 'deletedAt') {
          return { ...prev, by: 'lastUpdated' }
        }
        return prev
      })

      selectOrUnselectAllProjects(false)
    },
    [selectOrUnselectAllProjects]
  )

  const updateProjectViewData = useCallback((newProjectData: Project) => {
    setLoadedProjects(loadedProjects => {
      return loadedProjects.map(p =>
        p.id === newProjectData.id ? { ...newProjectData } : p
      )
    })
  }, [])

  const removeProjectFromView = useCallback((project: Project) => {
    setLoadedProjects(loadedProjects => {
      return loadedProjects.filter(p => p.id !== project.id)
    })
  }, [])

  const value = useMemo<ProjectListContextValue>(
    () => ({
      error,
      filter,
      hiddenProjectsCount,
      isLoading,
      loadMoreCount,
      loadMoreProjects,
      loadProgress,
      removeProjectFromView,
      selectFilter,
      selectedProjects,
      selectedProjectIds,
      selectOrUnselectAllProjects,
      searchText,
      setSearchText,
      setSelectedProjectIds,
      setSort,
      showAllProjects,
      sort,
      toggleSelectedProject,
      totalProjectsCount,
      updateProjectViewData,
      projectsOwnerId,
      visibleProjects,
    }),
    [
      error,
      filter,
      hiddenProjectsCount,
      isLoading,
      loadMoreCount,
      loadMoreProjects,
      loadProgress,
      removeProjectFromView,
      selectFilter,
      selectedProjectIds,
      selectedProjects,
      selectOrUnselectAllProjects,
      searchText,
      setSearchText,
      setSelectedProjectIds,
      setSort,
      showAllProjects,
      sort,
      toggleSelectedProject,
      totalProjectsCount,
      projectsOwnerId,
      updateProjectViewData,
      visibleProjects,
    ]
  )

  return (
    <ProjectListContext.Provider value={value}>
      {children}
    </ProjectListContext.Provider>
  )
}

export function useProjectListContext() {
  const context = useContext(ProjectListContext)
  if (!context) {
    throw new Error(
      'ProjectListContext is only available inside ProjectListProvider'
    )
  }
  return context
}
