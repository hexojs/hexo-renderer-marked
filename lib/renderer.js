'use strict';

const marked = require('marked');
const stripIndent = require('strip-indent');
const util = require('hexo-util');

const highlight = util.highlight;
const stripHTML = util.stripHTML;
const MarkedRenderer = marked.Renderer;

function Renderer() {
  MarkedRenderer.apply(this);

  this._headingId = {};
}

require('util').inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
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
  return util.slugize(str.trim(), {transform: transformOption});
}

// Support AutoLink option
Renderer.prototype.link = function(href, title, text) {
  let prot;

  if (this.options.sanitize) {
    try {
      prot = decodeURIComponent(unescape(href))
          .replace(/[^\w:]/g, '')
          .toLowerCase();
    } catch (e) {
      return '';
    }

    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
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
  let result = '';
  const dlTest = /(^|\s)(\S.+)(<br>:(\s+))(\S.+)/;

  const dl
    = '<dl>'
      + '<dt>$2</dt>'
      + '<dd>$5</dd>'
    + '</dl>';

  if (text.match(dlTest)) {
    result = text.replace(dlTest, dl);
  } else {
    result = `<p>${text}</p>\n`;
  }

  return result;
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
