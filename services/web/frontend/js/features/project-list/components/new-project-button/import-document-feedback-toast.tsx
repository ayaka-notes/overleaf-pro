import { GlobalToastGeneratorEntry } from '@/features/ide-react/components/global-toasts'
import { Trans } from 'react-i18next'

const DocxImportFeedbackToast = () => (
  <div>
    <Trans
      i18nKey="docx_import_feedback_message"
      components={[
        /* eslint-disable-next-line jsx-a11y/anchor-has-content, react/jsx-key */
        <a
          href="https://forms.gle/B1qrdiD983YcQCJA9"
          target="_blank"
          rel="noopener noreferrer"
        />,
      ]}
    />
  </div>
)

const MarkdownImportFeedbackToast = () => (
  <div>
    <Trans
      i18nKey="markdown_import_feedback_message"
      components={[
        /* eslint-disable-next-line jsx-a11y/anchor-has-content, react/jsx-key */
        <a
          href="https://forms.gle/BQnQ57wB9ddS1FdKA"
          target="_blank"
          rel="noopener noreferrer"
        />,
      ]}
    />
  </div>
)

const generators: GlobalToastGeneratorEntry[] = [
  {
    key: 'import:docx-feedback',
    generator: () => ({
      content: <DocxImportFeedbackToast />,
      type: 'info',
      autoHide: true,
      delay: 45000,
      isDismissible: true,
    }),
  },
  {
    key: 'import:markdown-feedback',
    generator: () => ({
      content: <MarkdownImportFeedbackToast />,
      type: 'info',
      autoHide: true,
      delay: 45000,
      isDismissible: true,
    }),
  },
]

export default generators

export const showImportDocumentFeedbackToast = (type: 'docx' | 'markdown') => {
  const key =
    type === 'markdown' ? 'import:markdown-feedback' : 'import:docx-feedback'
  window.dispatchEvent(
    new CustomEvent('ide:show-toast', {
      detail: { key },
    })
  )
}
