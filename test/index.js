'use strict';

var should = require('chai').should(); // eslint-disable-line
var util = require('hexo-util');
var url = require('url');

describe('Marked renderer', function() {
  var ctx = {
    config: {
      marked: {}
    },
    extend: {
      helper: {
        get: function(name) {
          return this.store[name];
        },

        store: {
          'url_for': function(path) {
            path = path || '/';

            var config = this.config;
            var root = config.root || '/';
            var data = url.parse(path);

            // Exit if this is an external path
            if (data.protocol || path.substring(0, 2) === '//') {
              return path;
            }

            // Prepend root path
            path = root + path;

            return path.replace(/\/{2,}/g, '/');
          }
        }
      }
    }
  };

  var r = require('../lib/renderer').bind(ctx);

  it('default', function() {
    var code = 'console.log("Hello world");';

    var body = [
      '# Hello world',
      '',
      '```',
      code,
      '```',
      '',
      '## Hello world',
      '',
      'hello',
      '',
      '[link text](/path/to/link)',
      '',
      '[link to anchor](#Hello_world)',
      '',
      '![img](/path/to/img)'
    ].join('\n');

    var result = r({text: body});

    result.should.eql([
        '<h1 id="Hello_world"><a href="#Hello_world" class="headerlink" title="Hello world"></a>Hello world</h1>',
        '<pre><code>' + util.highlight(code, {gutter: false, wrap: false}) + '\n</code></pre>',
        '<h2 id="Hello_world-1"><a href="#Hello_world-1" class="headerlink" title="Hello world"></a>Hello world</h2>',
        '<p>hello</p>\n',
        '<p><a href="/path/to/link">link text</a></p>\n',
        '<p><a href="#Hello_world">link to anchor</a></p>\n',
        '<p><img src="/path/to/img" alt="img"></p>'
      ].join('') + '\n');

    ctx.config.root = '/root/';
    result = r({text: body});
    result.should.eql([
        '<h1 id="Hello_world"><a href="#Hello_world" class="headerlink" title="Hello world"></a>Hello world</h1>',
        '<pre><code>' + util.highlight(code, {gutter: false, wrap: false}) + '\n</code></pre>',
        '<h2 id="Hello_world-1"><a href="#Hello_world-1" class="headerlink" title="Hello world"></a>Hello world</h2>',
        '<p>hello</p>\n',
        '<p><a href="/root/path/to/link">link text</a></p>\n',
        '<p><a href="#Hello_world">link to anchor</a></p>\n',
        '<p><img src="/root/path/to/img" alt="img"></p>'
      ].join('') + '\n');
  });

  it('should render headings with links', function() {
    var body = [
      '## [hexo-server]',
      '',
      '[hexo-server]: https://github.com/hexojs/hexo-server'
    ].join('\n');

    var result = r({text: body});

    result.should.eql([
      '<h2 id="hexo-server"><a href="#hexo-server" class="headerlink" title="hexo-server"></a>',
      '<a href="https://github.com/hexojs/hexo-server">hexo-server</a></h2>'
    ].join(''));
  });
});
