'use strict';

const marked = require('marked');
const stripIndent = require('strip-indent');
const { stripHTML, highlight, slugize } = require('hexo-util');
const MarkedRenderer = marked.Renderer;

function Renderer() {
  MarkedRenderer.apply(this);

  this._headingId = {};
}

require('util').inherits(Renderer, MarkedRenderer);

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
  if (this.options.sanitizeUrl) {
    let prot;

    try {
      prot = decodeURIComponent(unescape(href))
          .replace(/[^\w:]/g, '')
          .toLowerCase();
    } catch (e) {
      return '';
    }

    if (prot.startsWith('javascript:') || prot.startsWith('vbscript:') || prot.startsWith('data:')) {
      return '';
    }
  }

  if (!this.options.autolink && href === text && title == null) {
    return href;
  }

  let out = `<a href="${href}"`;

  if (title) {
    out += ` title="${title}"`;
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
  return marked(data.text, Object.assign({
    renderer: new Renderer()
  }, this.config.marked, options));
};
