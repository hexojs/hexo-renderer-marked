'use strict';

const { marked } = require('marked');

let JSDOM,
  createDOMPurify;

const { encodeURL, slugize, stripHTML, url_for, isExternalLink, escapeHTML: escape, unescapeHTML: unescape } = require('hexo-util');
const MarkedRenderer = marked.Renderer;
const MarkedTokenizer = marked.Tokenizer;
const { basename, dirname, extname, join } = require('path').posix;
const rATag = /<a(?:\s+?|\s+?[^<>]+\s+?)?href=["'](?:#)([^<>"']+)["'][^<>]*>/i;
const rDlSyntax = /(?:^|\s)(\S.+)<br>:\s+(\S.+)/;

const anchorId = (str, transformOption) => {
  return slugize(stripHTML(unescape(str)).trim(), { transform: transformOption });
};

class Renderer extends MarkedRenderer {
  constructor(hexo) {
    super();
    this._headingId = {};
    this.hexo = hexo;
  }

  // Add id attribute to headings
  heading(text, level) {
    const { anchorAlias, headerIds, modifyAnchors } = this.options;
    const { _headingId } = this;

    if (!headerIds) {
      return `<h${level}>${text}</h${level}>`;
    }

    const transformOption = modifyAnchors;
    let id = anchorId(text, transformOption);
    const headingId = _headingId;

    const anchorAliasOpt = anchorAlias && text.startsWith('<a href="#');
    if (anchorAliasOpt) {
      const customAnchor = text.match(rATag)[1];
      id = anchorId(customAnchor, transformOption);
    }

    // Add a number after id if repeated
    if (headingId[id]) {
      id += `-${headingId[id]++}`;
    } else {
      headingId[id] = 1;
    }

    if (anchorAliasOpt) {
      text = text.replace(rATag, (str, alias) => {
        return str.replace(alias, id);
      });
    }

    // add headerlink
    return `<h${level} id="${id}"><a href="#${id}" class="headerlink" title="${stripHTML(text)}"></a>${text}</h${level}>`;
  }

  link(href, title, text) {
    const { external_link, sanitizeUrl } = this.options;
    const { url: urlCfg } = this.hexo.config;

    if (sanitizeUrl) {
      if (href.startsWith('javascript:') || href.startsWith('vbscript:') || href.startsWith('data:')) {
        href = '';
      }
    }

    let out = '<a href="';

    try {
      out += encodeURL(href);
    } catch (e) {
      out += href;
    }

    out += '"';

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
    const { descriptionLists = true } = this.options;

    if (descriptionLists) {
      if (rDlSyntax.test(text)) {
        return text.replace(rDlSyntax, '<dl><dt>$1</dt><dd>$2</dd></dl>');
      }
    }

    return `<p>${text}</p>\n`;
  }

  // Prepend root to image path
  image(href, title, text) {
    const { hexo, options } = this;
    const { relative_link } = hexo.config;
    const { lazyload, figcaption, prependRoot, postPath } = options;

    if (!/^(#|\/\/|http(s)?:)/.test(href) && !relative_link && prependRoot) {
      if (!href.startsWith('/') && !href.startsWith('\\') && postPath) {
        const PostAsset = hexo.model('PostAsset');
        // findById requires forward slash
        const asset = PostAsset.findById(join(postPath, href.replace(/\\/g, '/')));
        // asset.path is backward slash in Windows
        if (asset) href = asset.path.replace(/\\/g, '/');
      }
      href = url_for.call(hexo, href);
    }

    let out = `<img src="${encodeURL(href)}"`;
    if (text) out += ` alt="${text}"`;
    if (title) out += ` title="${title}"`;
    if (lazyload) out += ' loading="lazy"';

    out += '>';
    if (figcaption) {
      if (text) out += `<figcaption aria-hidden="true">${text}</figcaption>`;
    }
    return out;
  }
}

marked.setOptions({
  langPrefix: ''
});

// https://github.com/markedjs/marked/blob/b6773fca412c339e0cedd56b63f9fa1583cfd372/src/Lexer.js#L8-L24
const smartypants = (str, quotes) => {
  const [openDbl, closeDbl, openSgl, closeSgl] = typeof quotes === 'string' && quotes.length === 4
    ? quotes
    : ['\u201c', '\u201d', '\u2018', '\u2019'];

  return str
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/([{"\s])'/g, '$1' + openSgl)
    // closing singles & apostrophes
    .replace(/'/g, closeSgl)
    // opening doubles
    .replace(/(^|[-\u2014/([{\u2018\s])"/g, '$1' + openDbl)
    // closing doubles
    .replace(/"/g, closeDbl)
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

class Tokenizer extends MarkedTokenizer {
  // Support AutoLink option
  url(src, mangle) {
    const { options } = this;
    const { autolink } = options;

    if (!autolink) return;
    return super.url(src, mangle);
  }

  // Override smartypants
  inlineText(src) {
    const { options, rules } = this;
    const { quotes, smartypants: isSmarty } = options;

    // https://github.com/markedjs/marked/blob/b6773fca412c339e0cedd56b63f9fa1583cfd372/src/Tokenizer.js#L643-L658
    const cap = rules.inline.text.exec(src);
    if (cap) {
      let text;
      if (this.lexer.state.inRawBlock || this.rules.inline.url.exec(src)) {
        text = cap[0];
      } else {
        text = escape(isSmarty ? smartypants(cap[0], quotes) : cap[0]);
      }
      return {
        type: 'text',
        raw: cap[0],
        text
      };
    }
  }
}

module.exports = function(data, options) {
  const { post_asset_folder, marked: markedCfg, source_dir } = this.config;
  const { prependRoot, postAsset, dompurify } = markedCfg;
  const { path, text } = data;

  // exec filter to extend renderer.
  const renderer = new Renderer(this);
  this.execFilterSync('marked:renderer', renderer, { context: this });

  const tokenizer = new Tokenizer();
  this.execFilterSync('marked:tokenizer', tokenizer, { context: this });

  const extensions = [];
  this.execFilterSync('marked:extensions', extensions, { context: this });
  marked.use({ extensions });

  let postPath = '';
  if (path && post_asset_folder && prependRoot && postAsset) {
    const Post = this.model('Post');
    // Windows compatibility, Post.findOne() requires forward slash
    const source = path.substring(this.source_dir.length).replace(/\\/g, '/');
    const post = Post.findOne({ source });
    if (post) {
      const { source: postSource } = post;
      postPath = join(source_dir, dirname(postSource), basename(postSource, extname(postSource)));
    }
  }

  let sanitizer = function(html) { return html; };

  if (dompurify) {
    if (createDOMPurify === undefined && JSDOM === undefined) {
      createDOMPurify = require('dompurify');
      JSDOM = require('jsdom').JSDOM;
    }
    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);
    let param = {};
    if (dompurify !== true) {
      param = dompurify;
    }
    sanitizer = function(html) { return DOMPurify.sanitize(html, param); };
  }
  return sanitizer(marked(text, Object.assign({
    renderer,
    tokenizer
  }, markedCfg, options, { postPath })));
};
