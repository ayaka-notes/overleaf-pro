import classnames from 'classnames'
import { User } from '../../../../../types/user/api'
import { getUserName } from '../../../project-list/util/user'

type UsersToDisplayProps = {
  users: User[]
  usersToDisplay: User[]
}

function UsersList({ users, usersToDisplay }: UsersToDisplayProps) {
  return (
    <ul>
      {usersToDisplay.map(user => (
        <li
          key={`users-action-list-${user.id}`}
          className={classnames({
            'list-style-check-green': !users.some(
              ({ id }) => id === user.id
            ),
          })}
        >
          <b>{`${getUserName(user)} <${user.email}>`}</b>
        </li>
      ))}
    </ul>
  )
}

export default UsersList
