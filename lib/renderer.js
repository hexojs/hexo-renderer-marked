'use strict';

var marked = require('marked');
var assign = require('object-assign');
var stripIndent = require('strip-indent');
var util = require('hexo-util');
var path = require('path');
var highlight = util.highlight;
var stripHTML = util.stripHTML;
var MarkedRenderer = marked.Renderer;

function Renderer(){
  MarkedRenderer.apply(this, arguments);

  this._headingId = {};
}

require('util').inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level){
  var id = anchorId(stripHTML(text));
  var headingId = this._headingId;

  // Add a number after id if repeated
  if (headingId[id]){
    id += '-' + headingId[id]++;
  } else {
    headingId[id] = 1;
  }

  return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
};

Renderer.prototype.link = function(href, title, text){
  
  href = addBaseLink(href, this.options.baseLink); 
  
  return MarkedRenderer.prototype.link.call(this, href, title, text);
};

Renderer.prototype.image = function(href, title, text){
  
  href = addBaseLink(href, this.options.baseLink);
  
  return MarkedRenderer.prototype.image.call(this, href, title, text);
};

function addBaseLink(href, baseLink){
  
  // Add baseLink if relative href
  var expScheme = /^((http|https|ftp):\/\/)/;
  
  if(!expScheme.test(href) && href.charAt(0) !== '/' && (href.charAt(0) !== '.')) {
        href = baseLink + href;
  }
  return href;
  
}

function anchorId(str){
  return str
    .replace(/\s+/g, '_')
    .replace(/\./g, '-')
    .replace(/-{2,}/g, '-');
}

marked.setOptions({
  langPrefix: '',
  highlight: function(code, lang){
    return highlight(stripIndent(code), {
      lang: lang,
      gutter: false,
      wrap: false
    });
  }
});

module.exports = function(data, options){
  
  var postPath = path.join(this.source.context.source_dir, '_posts');
  var pathDir = path.parse(data.path).dir;
  var dirFromBase = path.join(path.sep, path.relative(postPath, pathDir), path.sep);
  var pathBaseUrl = dirFromBase.split(path.sep).join('/');  
  
  // this.log.info('marked postDir: ', postPath);  
  // this.log.info('marked data.path: ', data.path);  
  // this.log.info('marked pathDir: ', pathDir);
  // this.log.info('marked dirFromBase: ', dirFromBase);
  // this.log.info('marked pathBaseUrl: ', pathBaseUrl);
  
  options.baseLink = pathBaseUrl;
  
  return marked(data.text, assign({
    renderer: new Renderer()
  }, this.config.marked, options));
};