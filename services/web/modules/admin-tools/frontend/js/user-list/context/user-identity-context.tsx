import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useCallback,
} from 'react'
import { User } from '../../../../types/user/api'
import { getUserName } from '../../project-list/util/user'

export type UserIdentityContextValue = {
  getUserById: (userId: string) => User | undefined
  getUserNameById: (userId: string) => string
}

const UserIdentityContext = createContext<
  UserIdentityContextValue | undefined
>(undefined)

type UserIdentityProviderProps = {
  users: User[]
  children: ReactNode
}

export function UserIdentityProvider({
  users,
  children,
}: UserIdentityProviderProps) {

  const usersById = useMemo(() => {
    const map = new Map<string, User>()
    for (const user of users) {
      map.set(user.id, user)
    }
    return map
  }, [users])

  const getUserById = useCallback(
    (userId: string) => {
      return usersById.get(userId)
    },
    [usersById]
  )

  const getUserNameById = useCallback(
    (userId: string) => {
      const user = usersById.get(userId)
      return getUserName(user)
    },
    [usersById]
  )

  const value = useMemo(
    () => ({
      getUserById,
      getUserNameById,
    }),
    [getUserById, getUserNameById]
  )

  return (
    <UserIdentityContext.Provider value={value}>
      {children}
    </UserIdentityContext.Provider>
  )
}

export function useUserIdentityContext() {
  const context = useContext(UserIdentityContext)
  if (!context) {
    throw new Error(
      'UserIdentityContext is only available inside UserIdentityProvider'
    )
  }
  return context
}
