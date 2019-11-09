'use strict';

const { inherits } = require('util');
const marked = require('marked');
const stripIndent = require('strip-indent');
const { encodeURL, highlight, slugize, stripHTML, url_for } = require('hexo-util');
const MarkedRenderer = marked.Renderer;
const { parse, URL } = require('url');

/**
 * Check whether the link is external
 * @param {String} url The url to check
 * @param {Object} siteCfg The site config
 * @param {String|array} exclude Domain(s) to be excluded
 * @returns {Boolean} True if the link is an internal link or having the same host with config.url
 */
const isExternal = (url, siteCfg, exclude) => {
  const sitehost = parse(siteCfg.url).hostname || siteCfg.url;
  if (!sitehost) return false;

  // handle relative url
  const data = new URL(url, `http://${sitehost}`);

  // handle mailto: javascript: vbscript: and so on
  if (data.origin === 'null') return false;

  const host = data.hostname;

  if (exclude) {
    exclude = Array.isArray(exclude) ? exclude : [exclude];

    for (const i of exclude) {
      if (host === i) return false;
    }
  }

  if (host !== sitehost) return true;

  return false;
};

function Renderer() {
  MarkedRenderer.apply(this);

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
    if (external_link.enable && isExternal(href, options.config, external_link.exclude)) {
      out += ' target="_blank" rel="noopener"';
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

  return `<img src="${encodeURL(href)}" alt="${text}">`;
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

  return marked(data.text, Object.assign({
    renderer: new Renderer()
  }, this.config.marked, options, siteCfg));
};
