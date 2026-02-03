import { SortingOrder } from '../../../../types/sorting-order'
import { MergeAndOverride } from '../../../../types/utils'
import { User } from '../user/api'

export type Page = {
  size: number
  lastId?: string
}

export type Sort = {
  by: 'lastUpdated' | 'title' | 'deletedAt' | 'owner'
  order: SortingOrder
}

export type Filters = {
  owned?: boolean
  trashed?: boolean
  deleted?: boolean
  search?: string
}

export type GetProjectsRequestBody = {
  page: Page
  sort: Sort
  filters: Filters
}

export type UserRef = Pick<
  User,
  'id' | 'email' | 'firstName' | 'lastName'
>


export type ProjectApi = {
  id: string
  name: string
  owner?: string
  lastUpdated: Date
  lastUpdatedBy: string | null
  trashed: boolean
  deleted: boolean
  inactive?: boolean
  deletedBy?: string
  deletedAt?: Date
}

export type Project = MergeAndOverride<
  ProjectApi,
  {
    lastUpdated: string
    deletedAt?: string
    selected?: boolean
  }
>

export type GetProjectsResponseBody = {
  totalSize: number
  projects: Project[]
}
