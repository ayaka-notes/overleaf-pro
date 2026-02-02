import logger from '@overleaf/logger'
import BibtexParser from './bib2json.js'

export default {
  async index(req, res) {
    const { docUrls, fullIndex } = req.body
    try {
      const responses = await Promise.all(
        docUrls.map(async (docUrl) => {
          try {
            const response = await fetch(docUrl)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            return response.text()
          } catch (error) {
            logger.error({ error }, "Failed to fetch document from URL: " + docUrl)
            return null
          }
        })
      )
      const keys = []
      for (const body of responses) {
        if (!body) continue

        try {
          const parsedEntries = BibtexParser(body).entries
          const ks = parsedEntries
            .filter(entry => entry.EntryKey)
            .map(entry => entry.EntryKey)
          keys.push(...ks)
        } catch (error) {
          logger.error({ error }, "bib file skipped.")
        }
      }
      res.status(200).json({ keys })
    } catch (error) {
      logger.error({ error }, "Unexpected error during indexing process.")
      res.status(500).json({ error: "Failed to process bib files." })
    }
  }
}
