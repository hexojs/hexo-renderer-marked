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
  sanitizeUrl: false,
  headerIds: true,
  // TODO: enable prependRoot by default in v3
  prependRoot: false,
  external_link: {
    enable: false,
    exclude: [],
    nofollow: false
  }
}, hexo.config.marked);

hexo.extend.renderer.register('md', 'html', renderer);
hexo.extend.renderer.register('markdown', 'html', renderer);
hexo.extend.renderer.register('mkd', 'html', renderer);
hexo.extend.renderer.register('mkdn', 'html', renderer);
hexo.extend.renderer.register('mdwn', 'html', renderer);
hexo.extend.renderer.register('mdtxt', 'html', renderer);
hexo.extend.renderer.register('mdtext', 'html', renderer);
