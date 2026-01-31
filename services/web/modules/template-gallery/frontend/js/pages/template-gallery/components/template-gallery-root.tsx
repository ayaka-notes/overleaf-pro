import { TemplateGalleryProvider } from '../context/template-gallery-context'
import { useTranslation } from 'react-i18next'
import useWaitForI18n from '@/shared/hooks/use-wait-for-i18n'
import withErrorBoundary from '@/infrastructure/error-boundary'
import { GenericErrorBoundaryFallback } from '@/shared/components/generic-error-boundary-fallback'
import getMeta from '@/utils/meta'
import DefaultNavbar from '@/shared/components/navbar/default-navbar'
import Footer from '@/shared/components/footer/footer'
import GalleryHeaderTagged from './gallery-header-tagged'
import GalleryHeaderAll from './gallery-header-all'
import TemplateGallery from './template-gallery'
import GallerySearchSortHeader from './gallery-search-sort-header'
import GalleryPopularTags from './gallery-popular-tags'

function TemplateGalleryRoot() {
  const { isReady } = useWaitForI18n()
  if (!isReady) {
    return null
  }
  return (
    <TemplateGalleryProvider>
      <TemplateGalleryPageContent />
    </TemplateGalleryProvider>
  )
}

function TemplateGalleryPageContent() {
  const { t } = useTranslation()
  const navbarProps = getMeta('ol-navbar')
  const footerProps = getMeta('ol-footer')
  const category = getMeta('ol-templateCategory')

  return (
    <>
      <DefaultNavbar {...navbarProps} />
      <main id="main-content"
        className={`content content-page gallery ${category ? 'gallery-tagged' : ''}`}
      >
        <div className="container">
          {category ? (
            <>
              <GalleryHeaderTagged category={category} />
              <TemplateGallery />
            </>
          ) : (
            <>
              <GalleryHeaderAll />
              <GalleryPopularTags />
              <hr className="w-full border-muted mb-5" />
              <div className="recent-docs">
                <GallerySearchSortHeader />
                <h2>{t('all_templates')}</h2>
                <TemplateGallery />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer {...footerProps} />
    </>
  )
}

export default withErrorBoundary(TemplateGalleryRoot, GenericErrorBoundaryFallback)
