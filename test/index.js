'use strict';

var should = require('chai').should(); // eslint-disable-line
var util = require('hexo-util');

describe('Marked renderer', function() {
  var ctx = {
    config: {
      marked: {}
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
      'hello'
    ].join('\n');

    var result = r({text: body});

    result.should.eql([
      '<h1 id="Hello_world"><a href="#Hello_world" class="headerlink" title="Hello world"></a>Hello world</h1>',
      '<pre><code>' + util.highlight(code, {gutter: false, wrap: false}) + '\n</code></pre>',
      '<h2 id="Hello_world-1"><a href="#Hello_world-1" class="headerlink" title="Hello world"></a>Hello world</h2>',
      '<p>hello</p>'
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
