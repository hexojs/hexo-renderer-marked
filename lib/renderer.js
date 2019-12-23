'use strict';

const { inherits } = require('util');
const marked = require('marked');
const stripIndent = require('strip-indent');
const { encodeURL, highlight, slugize, stripHTML, url_for, isExternalLink } = require('hexo-util');
const MarkedRenderer = marked.Renderer;
const { parse } = require('url');

function Renderer() {
  Reflect.construct(MarkedRenderer, this);

  this._headingId = {};
}

inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
  if (!this.options.headerIds) {
    return `<h${level}>${text}</h${level}>`;
  }

  const transformOption = this.options.modifyAnchors;
  let id = anchorId(stripHTML(text), transformOption);
  const headingId = this._headingId;

  // Add a number after id if repeated
  if (headingId[id]) {
    id += `-${headingId[id]++}`;
  } else {
    headingId[id] = 1;
  }
  // add headerlink
  return `<h${level} id="${id}"><a href="#${id}" class="headerlink" title="${stripHTML(text)}"></a>${text}</h${level}>`;
};

function anchorId(str, transformOption) {
  return slugize(str.trim(), {transform: transformOption});
}

// Support AutoLink option
Renderer.prototype.link = function(href, title, text) {
  const { options } = this;
  const { external_link } = options;

  if (options.sanitizeUrl) {
    if (href.startsWith('javascript:') || href.startsWith('vbscript:') || href.startsWith('data:')) {
      href = '';
    }
  }

  if (!options.autolink && href === text && title == null) {
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

    if (isExternalLink(href, options.config.url, external_link.exclude)) {
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
};

// Support Basic Description Lists
Renderer.prototype.paragraph = text => {
  const dlTest = /(?:^|\s)(\S.+)<br>:\s+(\S.+)/;

  const dl = '<dl><dt>$1</dt><dd>$2</dd></dl>';

  if (dlTest.test(text)) {
    return text.replace(dlTest, dl);
  }

  return `<p>${text}</p>\n`;
};

// Prepend root to image path
Renderer.prototype.image = function(href, title, text) {
  const { options } = this;

  if (!parse(href).hostname && !options.config.relative_link
    && options.prependRoot) {
    href = url_for.call(options, href);
  }

  let out = `<img src="${encodeURL(href)}"`;

  if (text) out += ` alt="${text}"`;
  if (title) out += ` title="${title}"`;

  out += '>';

  return out;
};

marked.setOptions({
  langPrefix: '',
  highlight(code, lang) {
    return highlight(stripIndent(code), {
      lang,
      gutter: false,
      wrap: false
    });
  }
});

module.exports = function(data, options) {
  const siteCfg = Object.assign({}, {
    config: {
      url: this.config.url,
      root: this.config.root,
      relative_link: this.config.relative_link
    }
  });

  // exec filter to extend renderer.
  let renderer = new Renderer();
  this.execFilterSync('marked:renderer', renderer, {context: this});

  return marked(data.text, Object.assign({
    renderer: renderer
  }, this.config.marked, options, siteCfg));
};
