import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'

export type PageState =
  | { type: 'users' }
  | { type: 'projects'; userId: string | null }

type UsersPageContextValue = {
  page: PageState
  showUsers: () => void
  showProjects: (userId: string) => void
}

const UsersPageContext =
  createContext<UsersPageContextValue | null>(null)

type ProviderProps = {
  children: ReactNode
}

function isPageState(value: unknown): value is PageState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as any
  if (v.type === 'users') return true
  if (v.type === 'projects') return v.userId === null || typeof v.userId === 'string'
  return false
}

export function UsersPageProvider({ children }: ProviderProps) {
  const [page, setPage] = useState<PageState>(() => {
    return isPageState(history.state)
      ? history.state
      : { type: 'users' }
  })

  useEffect(() => {
    if (!isPageState(history.state)) {
      history.replaceState(page, '')
    }

    const onPopState = (e: PopStateEvent) => {
      setPage(
        isPageState(e.state)
          ? e.state
          : { type: 'users' }
      )
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((state: PageState) => {
    history.pushState(state, '')
    setPage(state)
  }, [])

  const showUsers = useCallback(() => {
    navigate({ type: 'users' })
  }, [navigate])

  const showProjects = useCallback((userId: string) => {
    navigate({ type: 'projects', userId })
  }, [navigate])

  const value = useMemo<UsersPageContextValue>(
    () => ({
      page,
      showUsers,
      showProjects,
    }),
    [
      page,
      showUsers,
      showProjects,
    ]
  )

  return (
    <UsersPageContext.Provider
      value={value}
    >
      {children}
    </UsersPageContext.Provider>
  )
}

export function useUsersPageContext(): UsersPageContextValue {
  const context = useContext(UsersPageContext)
  if (!context) {
    throw new Error('UsersPageContext is only available inside UsersPageProvider')
  }
  return context
}
