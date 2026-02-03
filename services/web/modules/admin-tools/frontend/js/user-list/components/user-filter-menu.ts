import { Filter, useUserListContext } from '../context/user-list-context'

type UsersMenuFilterType = {
  children: (isActive: boolean) => React.ReactElement
  filter: Filter
}

function UsersFilterMenu({ children, filter }: UsersMenuFilterType) {
  const { filter: activeFilter } = useUserListContext()
  const isActive = (filter === activeFilter)

  return children(isActive)
}

export default UsersFilterMenu
