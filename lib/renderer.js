'use strict';

const marked = require('marked');
const { encodeURL, slugize, stripHTML, url_for, isExternalLink } = require('hexo-util');
const MarkedRenderer = marked.Renderer;
const { sep } = require('path');

const anchorId = (str, transformOption) => {
  return slugize(str.trim(), {transform: transformOption});
};

class Renderer extends MarkedRenderer {
  constructor(hexo) {
    super();
    this._headingId = {};
    this.hexo = hexo;
  }

  // Add id attribute to headings
  heading(text, level) {
    const { headerIds, modifyAnchors } = this.options;
    const { _headingId } = this;

    if (!headerIds) {
      return `<h${level}>${text}</h${level}>`;
    }

    const transformOption = modifyAnchors;
    let id = anchorId(stripHTML(text), transformOption);
    const headingId = _headingId;

    // Add a number after id if repeated
    if (headingId[id]) {
      id += `-${headingId[id]++}`;
    } else {
      headingId[id] = 1;
    }

    // add headerlink
    return `<h${level} id="${id}"><a href="#${id}" class="headerlink" title="${stripHTML(text)}"></a>${text}</h${level}>`;
  }

  // Support AutoLink option
  link(href, title, text) {
    const { autolink, external_link, sanitizeUrl } = this.options;
    const { url: urlCfg } = this.hexo.config;

    if (sanitizeUrl) {
      if (href.startsWith('javascript:') || href.startsWith('vbscript:') || href.startsWith('data:')) {
        href = '';
      }
    }
    if (!autolink && href === text && title == null) {
      return href;
    }

    let out = `<a href="${encodeURL(href)}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    if (external_link) {
      const target = ' target="_blank"';
      const noopener = ' rel="noopener"';
      const nofollowTag = ' rel="noopener external nofollow noreferrer"';
      if (isExternalLink(href, urlCfg, external_link.exclude)) {
        if (external_link.enable && external_link.nofollow) {
          out += target + nofollowTag;
        } else if (external_link.enable) {
          out += target + noopener;
        } else if (external_link.nofollow) {
          out += nofollowTag;
        }
      }
    }

    out += `>${text}</a>`;
    return out;
  }

  // Support Basic Description Lists
  paragraph(text) {
    const dlTest = /(?:^|\s)(\S.+)<br>:\s+(\S.+)/;
    const dl = '<dl><dt>$1</dt><dd>$2</dd></dl>';
    if (dlTest.test(text)) {
      return text.replace(dlTest, dl);
    }
    return `<p>${text}</p>\n`;
  }

  // Prepend root to image path
  image(href, title, text) {
    const { hexo, options } = this;
    const { relative_link } = hexo.config;
    const { lazyload, prependRoot, postId } = options;

    if (!/^(#|\/\/|http(s)?:)/.test(href) && !relative_link && prependRoot) {
      if (!/^(\/|\\)/.test(href) && postId) {
        const PostAsset = hexo.model('PostAsset');
        // slug requires platform-specific path
        const asset = PostAsset.findOne({ post: postId, slug: href.replace(/\/|\\/g, sep) });
        if (asset) href = encodeURL(('/' + asset.path).replace(/\\/g, '/').replace(/\/{2,}/g, '/'));
      }
      href = url_for.call(hexo, href);
    }

    let out = `<img src="${encodeURL(href)}"`;
    if (text) out += ` alt="${text}"`;
    if (title) out += ` title="${title}"`;
    if (lazyload) out += ' loading="lazy"';

    out += '>';
    return out;
  }
}

marked.setOptions({
  langPrefix: ''
});

module.exports = function(data, options) {
  const { post_asset_folder, marked: markedCfg } = this.config;
  const { prependRoot, postAsset } = markedCfg;
  const { path, text } = data;

  // exec filter to extend renderer.
  const renderer = new Renderer(this);
  this.execFilterSync('marked:renderer', renderer, {context: this});

  let postId = '';
  if (path && post_asset_folder && prependRoot && postAsset) {
    const Post = this.model('Post');
    // Windows compatibility, Post.findOne() requires forward slash
    const source = path.replace(this.source_dir, '').replace('\\', '/');
    const post = Post.findOne({ source });
    postId = post ? post._id : '';
  }

  return marked(text, Object.assign({
    renderer
  }, markedCfg, options, { postId }));
};
