import { useTranslation } from 'react-i18next'
import OLCol from '@/shared/components/ol/ol-col'
import OLRow from '@/shared/components/ol/ol-row'

export default function GalleryHeaderAll() {
  const { t } = useTranslation()
  return (
    <>
    <OLRow>
      <OLCol md={12}> 
        <nav className='gallery-filters'></nav>
      </OLCol>
    </OLRow>
    <div className="gallery-header">
      <OLRow>
        <OLCol md={12}>
          <h1 className="gallery-title">
            <span className="eyebrow-text">
              <span aria-hidden="true">&#123;</span>
              <span>{t('overleaf_template_gallery')}</span>
              <span aria-hidden="true">&#125;</span>
            </span>
            {t('latex_templates')}
          </h1>
        </OLCol>
      </OLRow>
      <div className="row">
        <div className="col-md-12">
          <p className="gallery-summary">{t('latex_templates_for_journal_articles')}
          </p>
        </div>
      </div>
    </div>
    </>
    
  )
}
