import { User } from '../../../../types/user/api'
export function getUserName(user: User) {

  if (!user) return '[N/A]'

  const { firstName, lastName, email } = user
  if (firstName || lastName) {
    return [firstName, lastName].filter(n => n != null).join(' ')
  }
  if (email) {
    return email
  }

  return '[Noname]'
}
