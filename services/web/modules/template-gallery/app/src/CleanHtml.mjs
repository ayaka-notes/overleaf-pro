import sanitizeHtml from 'sanitize-html'

const sanitizeOptions = {
  linksOnly: {
    allowedTags: ["a"],
    allowedAttributes: { "a": ["href"] }
  },
  reachText: {
    allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6",
                  "p", "blockquote", "ul", "ol", "li",
                  "em", "strong", "s", "code", "pre", "hr", "a"],
    allowedAttributes: { "a": ["href"] }
  },
  plainText: {
    allowedTags: [],
    allowedAttributes: {},
  },
}

export function cleanHtml(text, sanitizeType) {
  return sanitizeHtml(text, sanitizeOptions[sanitizeType])
}
