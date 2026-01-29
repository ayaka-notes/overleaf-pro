import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Template } from '../../types/template'
import { GetTemplatesResponseBody, Sort } from '../types/api'
import getMeta from '@/utils/meta'
import useAsync from '@/shared/hooks/use-async'
import { getTemplates } from '../util/api'
import sortTemplates from '../util/sort-templates'
import { debugConsole } from '@/utils/debugging'

export type TemplateGalleryContextValue = {
  visibleTemplates: Template[]
  totalTemplatesCount: number
  error: Error | null
  sort: Sort
  setSort: React.Dispatch<React.SetStateAction<Sort>>
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
}

export const TemplateGalleryContext = createContext<
  TemplateGalleryContextValue | undefined
>(undefined)

type TemplateGalleryProviderProps = {
  children: ReactNode
}

export function TemplateGalleryProvider({ children }: TemplateGalleryProviderProps) {
  const [loadedTemplates, setLoadedTemplates] = useState<Template[]>([])
  const [visibleTemplates, setVisibleTemplates] = useState<Template[]>([])
  const [totalTemplatesCount, setTotalTemplatesCount] = useState<number>(0)
  const [sort, setSort] = useState<Sort>({
    by: 'lastUpdated',
    order: 'desc',
  })
  const prevSortRef = useRef<Sort>(sort)

  const [searchText, setSearchText] = useState('')

  const {
    error,
    runAsync,
  } = useAsync<GetTemplatesResponseBody>()

  const category = getMeta('ol-templateCategory') || 'all'

  useEffect(() => {
    runAsync(getTemplates(sort, category))
      .then(data => {
        setLoadedTemplates(data.templates)
        setTotalTemplatesCount(data.totalSize)
      })
      .catch(debugConsole.error)
      .finally(() => {
      })
  }, [runAsync])

  useEffect(() => {
    let filteredTemplates = [...loadedTemplates]

    if (searchText.length) {
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    if (prevSortRef.current !== sort) {
      filteredTemplates = sortTemplates(filteredTemplates, sort)
      const loadedTemplatesSorted = sortTemplates(loadedTemplates, sort)
      setLoadedTemplates(loadedTemplatesSorted)
    }
      setVisibleTemplates(filteredTemplates)
  }, [
    loadedTemplates,
    searchText,
    sort,
  ])

  useEffect(() => {
    prevSortRef.current = sort
  }, [sort])


  const value = useMemo<TemplateGalleryContextValue>(
    () => ({
      error,
      searchText,
      setSearchText,
      setSort,
      sort,
      totalTemplatesCount,
      visibleTemplates,
    }),
    [
      error,
      searchText,
      setSearchText,
      setSort,
      sort,
      totalTemplatesCount,
      visibleTemplates,
    ]
  )

  return (
    <TemplateGalleryContext.Provider value={value}>
      {children}
    </TemplateGalleryContext.Provider>
  )
}

export function useTemplateGalleryContext() {
  const context = useContext(TemplateGalleryContext)
  if (!context) {
    throw new Error(
      'TemplateGalleryContext is only available inside TemplateGalleryProvider'
    )
  }
  return context
}
