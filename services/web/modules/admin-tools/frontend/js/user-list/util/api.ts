import { GetUsersResponseBody, Sort } from '../../../../types/user/api'
import { deleteJSON, getJSON, postJSON } from '@/infrastructure/fetch-json'

export function getUsers(sortBy: Sort): Promise<GetUsersResponseBody> {
  return postJSON('/admin/users', { body: { sort: sortBy } })
}

export function searchUsers(search: string): Promise<GetUsersResponseBody> {
  return postJSON('/admin/users/search', { body: { search } })
}

export function updateUser(userId: string, userData: Partial<User>) {
  return postJSON(`/admin/user/${userId}/update`, { body: userData })
}

export function deleteUser(
  userId: string,
  options: {
    sendEmail: boolean
    toUserId: string | null
  }
) {
  return postJSON(`/admin/user/${userId}/delete`, { body: options } )
}

export function restoreUser(userId: string) {
  return postJSON(`/admin/user/${userId}/restore`)
}

export function purgeUser(userId: string) {
  return deleteJSON(`/admin/user/${userId}`)
}

export function getAdditionalUserInfo(userId: string) {
  return getJSON(`/admin/user/${userId}/info`)
}

export function sendRegEmail(userId: string) {
  return postJSON(`/admin/user/${userId}/send-activation`)
}
