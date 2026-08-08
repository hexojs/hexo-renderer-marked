/* global hexo */

'use strict';

const renderer = require('./lib/renderer');

hexo.config.marked = Object.assign({
  gfm: true,
  pedantic: false,
  breaks: true,
  smartLists: true,
  smartypants: true,
  modifyAnchors: 0,
  autolink: true,
  mangle: true,
  sanitizeUrl: false,
  dompurify: false,
  headerIds: true,
  anchorAlias: false,
  lazyload: false,
  prependRoot: true,
  postAsset: false,
  resolveRelativeLinks: true,
  external_link: {
    enable: false,
    exclude: [],
    nofollow: false
  },
  descriptionLists: true
}, hexo.config.marked);

renderer.disableNunjucks = Boolean(hexo.config.marked.disableNunjucks);

// Hexo renders posts in a before_generate filter with the default priority (10).
// Invalidate the source lookup first so watch mode sees added, removed or renamed documents.
hexo.extend.filter.register('before_generate', () => renderer.clearLinkCache(hexo), 9);

hexo.extend.renderer.register('md', 'html', renderer, true);
hexo.extend.renderer.register('markdown', 'html', renderer, true);
hexo.extend.renderer.register('mkd', 'html', renderer, true);
hexo.extend.renderer.register('mkdn', 'html', renderer, true);
hexo.extend.renderer.register('mdwn', 'html', renderer, true);
hexo.extend.renderer.register('mdtxt', 'html', renderer, true);
hexo.extend.renderer.register('mdtext', 'html', renderer, true);
