import { useEffect } from 'react'
import { Sort } from '../../../../types/user/api'
import { SortingOrder } from '../../../../../../types/sorting-order'
import { useUserListContext } from '../context/user-list-context'

const toggleSort = (order: SortingOrder): SortingOrder => {
  return order === 'asc' ? 'desc' : 'asc'
}

function useSort() {
  const { filter, sort, setSort } = useUserListContext()

  const handleSort = (by: Sort['by']) => {
    setSort(prev => ({
      by,
      order: prev.by === by ? toggleSort(sort.order) : sort.order,
    }))
  }

  useEffect(() => {
    if (filter === 'deleted' && sort.by === 'signUpDate') {
      setSort(prev => ({ ...prev, by: 'deletedAt' }))
    }

    if (filter !== 'deleted' && sort.by === 'deletedAt') {
      setSort(prev => ({ ...prev, by: 'signUpDate' }))
    }
  }, [filter, sort.by, setSort])

  return { handleSort }
}

export default useSort
