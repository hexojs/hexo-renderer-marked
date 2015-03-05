'use strict';

var should = require('chai').should();
var util = require('hexo-util');

describe('Marked renderer', function(){
  var ctx = {
    config: {
      marked: {}
    }
  };

  var r = require('../lib/renderer').bind(ctx);

  it('default', function(){
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
      '<h1 id="Hello_world">Hello world</h1>',
      '<pre><code>' + util.highlight(code, {gutter: false, wrap: false}) + '\n</code></pre>',
      '<h2 id="Hello_world-1">Hello world</h2>',
      '<p>hello</p>'
    ].join('') + '\n');
  });
});