import { memo } from 'react'
import { cleanHtml } from '../../../../../app/src/CleanHtml.mjs'

function TemplateGalleryEntry({ template }) {
  return (
    <div className={"gallery-thumbnail col-12 col-md-6 col-lg-4"}>
      <a href={`/template/${template.id}`} className="thumbnail-link">
        <div className="thumbnail">
          <img
            src={`/template/${template.id}/preview?version=${template.version}&style=thumbnail`}
            alt={template.name}
          />
        </div>
        <span className="gallery-list-item-title">
          <span className="caption-title">{template.name}</span>
          <span className="badge-container"></span>
        </span>
      </a>
      <div className="caption">
        <p className="caption-description" dangerouslySetInnerHTML={{ __html: cleanHtml(template.description, 'plainText') }} />
      </div>
      <div className="author-name">
        <div dangerouslySetInnerHTML={{ __html: cleanHtml(template.author, 'plainText') }} />
      </div>
    </div>
  )
}

export default memo(TemplateGalleryEntry)
