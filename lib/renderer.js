'use strict';

var marked = require('marked');
var assign = require('object-assign');
var stripIndent = require('strip-indent');
var util = require('hexo-util');

var highlight = util.highlight;
var stripHTML = util.stripHTML;
var MarkedRenderer = marked.Renderer;

function Renderer() {  
  MarkedRenderer.listitem = function(text){
    if (/^\s*\[[x ]\]\s*/.test(text)) {
      text = text.replace(/^\s*\[ \]\s*/, '<i class="empty checkbox icon"></i> ').replace(/^\s*\[x\]\s*/, '<i class="checked checkbox icon"></i> ');
      return '<li style="list-style: none">' + text + '</li>';
    } else {
      return '<li>' + text + '</li>';
    }
  };

  MarkedRenderer.apply(this);

  this._headingId = {};
}

require('util').inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
  var transformOption = this.options.modifyAnchors;
  var id = anchorId(stripHTML(text), transformOption);
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

function anchorId(str, transformOption) {
  return util.slugize(str.trim(), {transform: transformOption});
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
    renderer: new Renderer()
  }, this.config.marked, options));
};
