import { useTranslation } from 'react-i18next'
import getMeta from '@/utils/meta'

export default function GalleryPopularTags() {
  const { t } = useTranslation()
  const { templateLinks } = getMeta('ol-ExposedSettings') || []

  if(!templateLinks || templateLinks.length < 2) return null

  return (
    <div className="popular-tags">
      <h1>{t('categories')}</h1>
      <div className="row popular-tags-list">
        {templateLinks?.filter(link => link.url.split("/").pop() !== "all").map((link, index) => (
          <div key={index} className="gallery-thumbnail col-12 col-md-6 col-lg-4">
            <a href={link.url}>
              <div className="thumbnail-tag">
                <img
                  src={`/img/website-redesign/gallery/${link.url.split("/").pop()}.svg`}
                  alt={link.name}
                />
              </div>
              <span className="caption-title">{link.name}</span>
            </a>
            <p>{link.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
