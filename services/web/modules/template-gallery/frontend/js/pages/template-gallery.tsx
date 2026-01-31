import ReactDOM from 'react-dom/client'
import TemplateGalleryRoot from './template-gallery/components/template-gallery-root'
import '../../stylesheets/templates-v2-extra.scss'


const element = document.getElementById('template-gallery-root')
if (element) {
  const root = ReactDOM.createRoot(element)
  root.render(<TemplateGalleryRoot />)
}
