var marked = require('marked');
var _ = require('lodash');
var stripIndent = require('strip-indent');
var util = require('hexo-util');
var highlight = util.highlight;
var stripHTML = util.format.stripHTML;
var headingId = {};

var r = new marked.Renderer();

// Add id attribute to headings
r.heading = function(text, level){
  var id = anchorId(stripHTML(text));

  // Add a number after id if repeated
  if (headingId[id]){
    id += '-' + headingId[id]++;
  } else {
    headingId[id] = 1;
  }

  return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
}

function anchorId(str){
  return str
    .replace(/\s+/g, '_')
    .replace(/\./g, '-')
    .replace(/-{2,}/g, '-');
}

marked.setOptions({
  renderer: r,
  langPrefix: '',
  highlight: function(code, lang){
    return highlight(stripIndent(code), {
      lang: lang,
      gutter: false,
      wrap: false
    });
  }
});

function markedRenderer(data, options){
  // Reset cache
  headingId = {};

  return marked(data.text, _.extend({
    gfm: true,
    pedantic: false,
    sanitize: false,
    tables: true,
    breaks: true,
    smartLists: true,
    smartypants: true
  }, this.config.marked, options));
}

module.exports = markedRenderer;