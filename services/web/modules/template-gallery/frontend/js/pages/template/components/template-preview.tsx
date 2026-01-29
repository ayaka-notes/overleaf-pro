import OLCol from '@/shared/components/ol/ol-col'
import OLRow from '@/shared/components/ol/ol-row'
import { useTemplateContext } from '../context/template-context'


function TemplatePreview() {
  const { template, setTemplate } = useTemplateContext()
  return (
    <div className="entry">
      <OLRow>
        <OLCol md={12}>
          <div className="gallery-large-pdf-preview">
            <img
              src={`/template/${template.id}/preview?version=${template.version}&style=preview`}
              alt={template.name}
            />
          </div>
        </OLCol>
      </OLRow>
    </div>
  )
}
export default TemplatePreview
