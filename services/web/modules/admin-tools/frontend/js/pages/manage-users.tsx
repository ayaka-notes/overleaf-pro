import { createRoot } from 'react-dom/client'
import ManageUsersRoot from '../manage-users-root'
import '../../stylesheets/user-list-ds-nav.scss'
import '../../stylesheets/user-list.scss'

const element = document.getElementById('manage-users-root')
if (element) {
  const root = createRoot(element)
  root.render(<ManageUsersRoot />)
}
