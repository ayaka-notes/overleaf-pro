import { useTranslation } from 'react-i18next'
import getMeta from '@/utils/meta'
import OLCol from '@/shared/components/ol/ol-col'
import OLRow from '@/shared/components/ol/ol-row'
import OLTooltip from '@/shared/components/ol/ol-tooltip'
import OLButton from '@/shared/components/ol/ol-button'
import { formatDate, fromNowDate } from '@/utils/dates'
import { cleanHtml } from '../../../../../app/src/CleanHtml.mjs'

import { useTemplateContext } from '../context/template-context'
import DeleteTemplateButton from './delete-template-button'
import EditTemplateButton from './edit-template-button'
import { licensesMap } from './settings/settings-license'
import MaterialIcon from '@/shared/components/material-icon'

function TemplateDetails() {
  const { t } = useTranslation()
  const {template, setTemplate} = useTemplateContext()
  const lastUpdatedDate = fromNowDate(template.lastUpdated)
  const tooltipText = formatDate(template.lastUpdated)
  const loggedInUserId = getMeta('ol-user_id')
  const loggedInUserIsAdmin = getMeta('ol-userIsAdmin')

  const openAsTemplateParams = new URLSearchParams({
    id: template.id,
    version: template.version,
    ...(template.brandVariationId && { brandVariationId: template.brandVariationId }),
    name: template.name,
    compiler: template.compiler,
    mainFile: template.mainFile,
    language: template.language,
    ...(template.imageName && { imageName: template.imageName })
  }).toString()

  const sanitizedAuthor = cleanHtml(template.author, 'linksOnly') || t('anonymous')
  const sanitizedDescription = cleanHtml(template.description, 'reachText')

  return (
    <>
    <OLRow>
      <OLCol md={12}>
        <div className={"gallery-item-title"}>
          <h1 className="h2">{template.name}</h1>
        </div>
      </OLCol>
    </OLRow>
    <OLRow className="cta-links-container">
      <OLCol md={12} className="cta-links">
        <a className="btn btn-primary cta-link" href={`/project/new/template/?${openAsTemplateParams}`}>{t('open_as_template')}</a>
        <a className="btn btn-secondary cta-link" href={`/template/${template.id}/preview?version=${template.version}`}>{t('view_pdf')}</a>
        <a className="btn btn-secondary cta-link" href={`/template/${template.id}/zip?version=${template.version}`}>
          <MaterialIcon type="CloudDownload" size="1x" /> 
        </a>
      </OLCol>
    </OLRow>
    <div className="template-details-container">
      <div className="template-detail">
        <div>
          <b>{t('author')}:</b>
        </div>
        <div dangerouslySetInnerHTML={{ __html: sanitizedAuthor }} />
      </div>
      <div className="template-detail">
        <div>
          <b>{t('last_updated')}:</b>
        </div>
        <div>
          <OLTooltip
            id={`${template.id}`}
            description={tooltipText}
            overlayProps={{ placement: 'bottom', trigger: ['hover', 'focus'] }}
          >
            <span>
              {lastUpdatedDate.trim()}
            </span>
          </OLTooltip>
        </div>
      </div>
      <div className="template-detail">
        <div>
          <b>{t('license')}:</b>
        </div>
        <div>
          {licensesMap[template.license]}
        </div>
      </div>
        {sanitizedDescription && (
          <div className="template-detail">
            <div>
              <b>{t('abstract')}:</b>
            </div>
            <div
              className="gallery-abstract"
              data-ol-mathjax=""
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}>
            </div>
          </div>
        )}
    </div>
    {loggedInUserId && (loggedInUserId === template.owner || loggedInUserIsAdmin) && (
      <OLRow className="cta-links-container">
        <OLCol md={12} className="text-end">
          {
            template.project_id && (
              <OLButton variant="secondary" href={`/project/${template.project_id}`} className="cta-link">
                {t('templates_admin_source_project')}
              </OLButton>
            )
          }
          <EditTemplateButton />
          <DeleteTemplateButton />
        </OLCol>
      </OLRow>
    )}
    </>
  )
}
export default TemplateDetails
