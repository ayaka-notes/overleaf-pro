import ReactDOM from 'react-dom/client'
import TemplateRoot from './template/components/template-root'
import '../../stylesheets/templates-v2-extra.scss'


const element = document.getElementById('template-root')
if (element) {
  const root = ReactDOM.createRoot(element)
  root.render(<TemplateRoot />)
}
