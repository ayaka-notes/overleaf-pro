import settings from "@overleaf/settings";

const sanitizeOptions = {
  allowedTags: [
    'a',
    'abbr',
    'address',
    'article',
    'aside',
    'b',
    'blockquote',
    'br',
    'caption',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'div',
    'dl',
    'dt',
    'em',
    'figure',
    'figcaption',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'ins',
    'kbd',
    'li',
    'main',
    'ol',
    'p',
    'pre',
    's',
    'section',
    'small',
    'span',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'u',
    'ul',
    'video',
    'source',
    'iframe',
  ],
  allowedAttributes: {
    '*': [
      'aria-describedby',
      'aria-hidden',
      'aria-label',
      'class',
      'data-*',
      'dir',
      'id',
      'lang',
      'role',
      'style',
      'title',
      'translate',
    ],
    a: ['href', 'name', 'target', 'rel'],
    img: ['alt', 'decoding', 'height', 'loading', 'src', 'srcset', 'width'],
    iframe: [
      'allow',
      'allowfullscreen',
      'frameborder',
      'height',
      'loading',
      'referrerpolicy',
      'src',
      'title',
      'width',
    ],
    td: ['colspan', 'rowspan', 'headers'],
    th: ['abbr', 'colspan', 'rowspan', 'headers', 'scope'],
    time: ['datetime'],
    video: ['controls', 'height', 'poster', 'src', 'width'],
    source: ['src', 'type'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    'a': (tagName, attribs) => {
      if (attribs.href && attribs.href.startsWith('/learn/')) {
        attribs.href = attribs.href.replace(/^\/learn\//, '/learn/latex/');
      }
      return { tagName, attribs };
    },
    'img': (tagName, attribs) => {
      if (attribs.src && attribs.src.startsWith('/learn-scripts/images/')) {
        attribs.src = settings.apis.wiki.url + attribs.src;
        return { tagName, attribs };
      }
      // Keep other images unchanged
      return { tagName, attribs };
    }
  }
}

export { sanitizeOptions }