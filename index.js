var marked = require('marked'),
  _ = require('lodash'),
  util = hexo.util,
  highlight = util.highlight,
  htmlTag = util.html_tag,
  format = util.format,
  stripHtml = format.stripHtml,
  headingId = {};

var anchorId = function(str){
  return str
    .replace(/\s+/g, '_')
    .replace(/\./g, '-')
    .replace(/-{2,}/g, '-');
};

var r = new marked.Renderer();

// Add id attribute to headings
r.heading = function(text, level){
  var id = anchorId(stripHtml(text));

  // Add a number after id if repeated
  if (headingId.hasOwnProperty(id)){
    id += '-' + headingId[id];
    headingId[text]++;
  } else {
    headingId[id] = 1;
  }

  return htmlTag('h' + level, {id: id}, text) + '\n';
};

marked.setOptions({
  renderer: r,
  langPrefix: '',
  highlight: function(code, lang){
    return highlight(code, {lang: lang, gutter: false, wrap: false});
  }
});

var renderer = function(data, options){
  headingId = {};

  return marked(data.text, _.extend({
    gfm: true,
    pedantic: false,
    sanitize: false,
    tables: true,
    breaks: true,
    smartLists: true,
    smartypants: true
  }, hexo.config.marked, options));
};

hexo.extend.renderer.register('md', 'html', renderer, true);
hexo.extend.renderer.register('markdown', 'html', renderer, true);
hexo.extend.renderer.register('mkd', 'html', renderer, true);
hexo.extend.renderer.register('mkdn', 'html', renderer, true);
hexo.extend.renderer.register('mdwn', 'html', renderer, true);
hexo.extend.renderer.register('mdtxt', 'html', renderer, true);
hexo.extend.renderer.register('mdtext', 'html', renderer, true);