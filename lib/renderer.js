'use strict';

var marked = require('marked');
var assign = require('object-assign');
var stripIndent = require('strip-indent');
var util = require('hexo-util');

var highlight = util.highlight;
var stripHTML = util.stripHTML;
var MarkedRenderer = marked.Renderer;

function Renderer(ctx) {
  MarkedRenderer.apply(this);

  this._headingId = {};
  this.ctx = ctx;
  this.url_for = ctx.extend.helper.get('url_for');
}

require('util').inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
  var id = anchorId(stripHTML(text));
  var headingId = this._headingId;

  // Add a number after id if repeated
  if (headingId[id]) {
    id += '-' + headingId[id]++;
  } else {
    headingId[id] = 1;
  }
  // add headerlink
  return '<h' + level + ' id="' + id + '"><a href="#' + id + '" class="headerlink" title="' + stripHTML(text) + '"></a>' + text + '</h' + level + '>';
};

Renderer.prototype.link = function(href, title, text) {
  href = this.url_for.call(this.ctx, href);
  return MarkedRenderer.prototype.link.call(this, href, title, text);
};

Renderer.prototype.image = function(href, title, text) {
  href = this.url_for.call(this.ctx, href);
  return MarkedRenderer.prototype.image.call(this, href, title, text);
};

function anchorId(str) {
  // Add support for Chinese
  return escape(str
    .replace(/\s+/g, '_')
    .replace(/\./g, '-')
    .replace(/-{2,}/g, '-'))
    .replace(/%/g, '_')
    .replace(/^[\-_]+|[\-_]+$/g, '');
}

marked.setOptions({
  langPrefix: '',
  highlight: function(code, lang) {
    return highlight(stripIndent(code), {
      lang: lang,
      gutter: false,
      wrap: false
    });
  }
});

module.exports = function(data, options) {
  return marked(data.text, assign({
    renderer: new Renderer(this)
  }, this.config.marked, options));
};
