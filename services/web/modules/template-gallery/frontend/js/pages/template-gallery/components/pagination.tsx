import { useTranslation } from 'react-i18next'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  const pageNumbers = []
  let startPage = Math.max(1, currentPage - 4)
  let endPage = Math.min(totalPages, currentPage + 4)

  if (startPage > 1) {
    pageNumbers.push(1)
    if (startPage > 2) {
      pageNumbers.push("...")
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push("...")
    }
    pageNumbers.push(totalPages)
  }

  return (
    <nav role="navigation" aria-label={t('pagination_navigation')}>
      <ul className="pagination">
{/*
        {currentPage > 1 && (
          <li>
            <button aria-label={t('go_to_first_page')} onClick={() => onPageChange(1)}>
              &lt;&lt; {t('first')}
            </button>
          </li>
        )}
*/}
        {currentPage > 1 && (
          <li>
            <button aria-label={t('go_prev_page')} onClick={() => onPageChange(currentPage - 1)}>
              &lt; {t('prev')}
            </button>
          </li>
        )}
        {pageNumbers.map((page, index) => (
          <li key={index} className={page === currentPage ? "active" : ""}>
            {page === "..." ? (
              <span aria-hidden="true">{page}</span>
            ) : page === currentPage ? (
              <span aria-label={t('page_current', { page })} aria-current="true">{page}</span>
            ) : (
              <button aria-label={t('go_page', { page })} onClick={() => onPageChange(page)}>
                {page}
              </button>
            )}
          </li>
        ))}
        {currentPage < totalPages && (
          <li>
            <button aria-label={t('go_next_page')} onClick={() => onPageChange(currentPage + 1)}>
              {t('next')} &gt;
            </button>
          </li>
        )}
{/*
        {currentPage < totalPages && (
          <li>
            <button aria-label={t('go_to_last_page')} onClick={() => onPageChange(totalPages)}>
              {t('last')} &gt;&gt;
            </button>
          </li>
        )}
*/}
      </ul>
    </nav>
  )
}
