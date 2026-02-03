import { createRoot } from 'react-dom/client'
import ManageProjectsRoot from '../manage-projects-root'
import '../../stylesheets/user-list-ds-nav.scss'
import '../../stylesheets/user-list.scss'

const element = document.getElementById('manage-projects-root')
if (element) {
  const root = createRoot(element)
  root.render(<ManageProjectsRoot />)
}
