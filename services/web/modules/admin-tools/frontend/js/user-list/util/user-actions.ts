import { User } from '../../../../types/user/api'
import { updateUser, deleteUser, purgeUser, restoreUser, sendRegEmail } from './api'

export type PostActions = {
  toggleSelectedUser?: (id: string, selected: boolean) => void
  updateUserViewData?: (user: User) => void
  removeUserFromView?: (user: User) => void
}

export async function performDeleteUser(
  user: User,
  postActions: PostActions,
  options: { sendEmail: boolean, toUserId: string | null },
) {
  return deleteUser(user.id, options).then(data => {
    postActions.toggleSelectedUser(user.id, false)
    postActions.updateUserViewData({
      ...user,
      ...data,
      deleted: true,
    })
  })
}

export function performUpdateUser(
  user: User,
  postActions: PostActions,
  options: { userData: Partial<User> },
) {

  const dataToUpdate = { ...options.userData}
  if (!user.allowUpdateDetails) {
    delete dataToUpdate.firstName
    delete dataToUpdate.lastName
  }
  if (!user.allowUpdateIsAdmin) {
    delete dataToUpdate.isAdmin
  }

  return updateUser(user.id, dataToUpdate).then(data => {
    postActions.toggleSelectedUser(user.id, false)
    postActions.updateUserViewData({
      ...user,
      ...data
    })
  })
}

export function performRestoreUser(
  user: User,
  postActions: PostActions,
) {

  return restoreUser(user.id).then(() => {
    postActions.toggleSelectedUser(user.id, false)
    postActions.updateUserViewData({
      ...user,
      deletedAt: undefined,
      deleted: false,
    })
  })
}

export function performPurgeUser(
  user: User,
  postActions: PostActions
) {
  return purgeUser(user.id).then(() => {
    postActions.removeUserFromView(user)
  })
}

export function performSendRegEmail(
  user: User,
  postActions: PostActions,
) {

  return sendRegEmail(user.id).then(() => {
    postActions.toggleSelectedUser(user.id, false)
  })
}
