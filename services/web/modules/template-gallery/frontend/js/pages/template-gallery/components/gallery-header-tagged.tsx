import getMeta from '@/utils/meta'
import OLCol from '@/shared/components/ol/ol-col'
import OLRow from '@/shared/components/ol/ol-row'
import GallerySearchSortHeader from './gallery-search-sort-header'

export default function GalleryHeaderTagged({ category }) {
  const title = getMeta('og:title')
  const { templateLinks } = getMeta('ol-ExposedSettings') || []

  const description = templateLinks?.find(link => link.url.split("/").pop() === category)?.description
  const gotoAllLink = (category !== 'all')
  
  return (
    <div className="tagged-header-container">
      <GallerySearchSortHeader
        gotoAllLink={gotoAllLink}
      />
      { category && (
        <>
          <OLRow>
            <OLCol xs={12}>
              <h1 className="gallery-title">{title}</h1>
            </OLCol>
          </OLRow>
          <OLRow>
            <OLCol lg={8}>
              <p className="gallery-summary">{description}</p>
            </OLCol>
          </OLRow>
        </>
      )}
    </div>
  )
}
