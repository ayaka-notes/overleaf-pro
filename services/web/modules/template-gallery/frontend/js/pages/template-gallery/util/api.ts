import { GetTemplatesResponseBody, Sort } from '../types/api'
import { getJSON } from '@/infrastructure/fetch-json'

export function getTemplates(sortBy: Sort, category: string): Promise<GetTemplatesResponseBody> {
  const queryParams = new URLSearchParams({
    by: sortBy.by,
    order: sortBy.order,
    category,
  }).toString()

  return getJSON(`/api/templates?${queryParams}`)
}
