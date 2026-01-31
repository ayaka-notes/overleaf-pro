import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import OLRow from '@/shared/components/ol/ol-row'
import { useTemplateGalleryContext } from '../context/template-gallery-context'
import TemplateGalleryEntry from './template-gallery-entry'
import Pagination from './pagination'

export default function TemplateGallery() {
  const { t } = useTranslation()
  const {
    searchText,
    sort,
    visibleTemplates,
  } = useTemplateGalleryContext()

  const templatesPerPage = 6
  const totalPages = Math.ceil(visibleTemplates.length / templatesPerPage)

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [sort])

  const [lastNonSearchPage, setLastNonSearchPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  useEffect(() => {
    if (searchText.length > 0) {
      if (!isSearching) {
        setLastNonSearchPage(currentPage)
        setIsSearching(true)
      }
      setCurrentPage(1)
    } else {
      if (isSearching) {
        setCurrentPage(lastNonSearchPage)
        setIsSearching(false)
      }
    }
  }, [searchText])

  const startIndex = (currentPage - 1) * templatesPerPage
  const currentTemplates = visibleTemplates.slice(startIndex, startIndex + templatesPerPage)

  return (
    <>
      <OLRow className="gallery-container">
        {currentTemplates.length > 0 ? (
          currentTemplates.map(p => (
            <TemplateGalleryEntry
              className="gallery-thumbnail col-12 col-md-6 col-lg-4"
              key={p.id}
              template={p}
            />
          ))
        ) : (
          <OLRow>
            <p className="text-center">{"No Templates."}</p>
          </OLRow>
        )}
      </OLRow>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  )
}
