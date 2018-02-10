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
      '<h1 id="Hello-world"><a href="#Hello-world" class="headerlink" title="Hello world"></a>Hello world</h1>',
      '<pre><code>' + util.highlight(code, {gutter: false, wrap: false}) + '\n</code></pre>',
      '<h2 id="Hello-world-1"><a href="#Hello-world-1" class="headerlink" title="Hello world"></a>Hello world</h2>',
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

  it('should render headings with id collision', function() {
    var body = [
      '## example',
      '',
      '# example',
      '',
      '## example-1',
      '',
      '### example',
      '',
      '#### example-2',
      '',
      '## example-1'
    ].join('\n');

    var result = r({text: body});

    result.should.eql([
      '<h2 id="example"><a href="#example" class="headerlink" title="example"></a>example</h2>',
      '<h1 id="example-1"><a href="#example-1" class="headerlink" title="example"></a>example</h1>',
      '<h2 id="example-1-1"><a href="#example-1-1" class="headerlink" title="example-1"></a>example-1</h2>',
      '<h3 id="example-2"><a href="#example-2" class="headerlink" title="example"></a>example</h3>',
      '<h4 id="example-2-1"><a href="#example-2-1" class="headerlink" title="example-2"></a>example-2</h4>',
      '<h2 id="example-1-2"><a href="#example-1-2" class="headerlink" title="example-1"></a>example-1</h2>'
    ].join(''));
  });

  it('should handle chinese headers properly', function() {
    var body = '# 中文';
    var result = r({text: body});

    result.should.eql('<h1 id="中文"><a href="#中文" class="headerlink" title="中文"></a>中文</h1>');
  });

  it('to-do list testing', function() {
    var body = [
      '- [ ] test unchecked',
      '- [x] test checked',
      '- normal list [x] [ ]',
      '',
      'normal text [x] [ ]',
      '',
      '[x] [ ] normal text'
    ].join('\n');

    var result = r({text: body});

    result.should.eql([
      '<ul>\n',
      '<li style="list-style: none"><input type="checkbox"></input> test unchecked</li>\n',
      '<li style="list-style: none"><input type="checkbox" checked></input> test checked</li>\n',
      '<li>normal list [x] [ ]</li>\n',
      '</ul>\n',
      '<p>normal text [x] [ ]</p>\n',
      '<p>[x] [ ] normal text</p>\n'
    ].join(''));
  });

  // Description List tests

  it('should render description lists with a single space after the colon', function() {
    var result = r({text: 'Description Term<br>: This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with multiple spaces after the colon', function() {
    var result = r({text: 'Description Term<br>:    This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with a tab after the colon', function() {
    var result = r({text: 'Description Term<br>:	This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with a carriage return after the colon', function() {
    var result = r({text: 'Description Term<br>:\nThis is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should not render regular paragraphs as description lists', function() {
    var result = r({text: 'Description Term<br>:This is the Description'});
    result.should.eql('<p>Description Term<br>:This is the Description</p>\n');
  });

  describe('autolink option tests', function() {
    var ctx = {
      config: {
        marked: {
          autolink: true
        }
      }
    };

    var renderer = require('../lib/renderer');

    var body = [
      'Great website http://hexo.io',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('autolink enabled', function() {
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<p>Great website <a href="http://hexo.io">http://hexo.io</a></p>\n',
        '<p><a href="http://hexo.io">Hexo</a></p>\n'
      ].join(''));
    });

    it('autolink disabled', function() {
      ctx.config.marked.autolink = false;
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<p>Great website http://hexo.io</p>\n',
        '<p><a href="http://hexo.io">Hexo</a></p>\n'
      ].join(''));
    });
  });

  describe('modifyAnchors option tests', function() {
    var body = [
      '- [Example](#example)',
      '',
      '# Example'
    ].join('\n');

    var renderer = require('../lib/renderer');

    var ctx = {
      config: {
        marked: {
          modifyAnchors: ''
        }
      }
    };

    it('should not modify anchors with default options', function() {
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href=\"#example\">Example</a></li>',
        '</ul>',
        '<h1 id=\"Example\"><a href=\"#Example\" class=\"headerlink\" title=\"Example\"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to upperCase in case of modifyAnchors option is 2', function() {
      ctx.config.marked.modifyAnchors = 2;
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href=\"#example\">Example</a></li>',
        '</ul>',
        '<h1 id=\"EXAMPLE\"><a href=\"#EXAMPLE\" class=\"headerlink\" title=\"Example\"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to lowerCase in case of modifyAnchors option is 1', function() {
      ctx.config.marked.modifyAnchors = 1;
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href=\"#example\">Example</a></li>',
        '</ul>',
        '<h1 id=\"example\"><a href=\"#example\" class=\"headerlink\" title=\"Example\"></a>Example</h1>'
      ].join('\n'));
    });
  });

  describe('anchorAlias option tests', function() {
    var body = [
      '# example',
      '',
      '## example',
      '',
      '### [example-1]',
      '',
      '#### [example](http://example.com)',
      '',
      '##### example-2',
      '',
      '# [example-1](#example)',
      '',
      '## [example](#example-1)',
      '',
      '### [example](#example-anchor)',
      '',
      '#### [中文](#chinese)',
      '',
      '##### []()',
      '',
      '[example-1]: http://example.com'
    ].join('\n');

    var renderer = require('../lib/renderer');

    var ctx = {
      config: {
        marked: {
          anchorAlias: false
        }
      }
    };

    it('should not modify anchors with default options', function() {
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<h1 id="example"><a href="#example" class="headerlink" title="example"></a>example</h1>',
        '<h2 id="example-1"><a href="#example-1" class="headerlink" title="example"></a>example</h2>',
        '<h3 id="example-1-1"><a href="#example-1-1" class="headerlink" title="example-1"></a><a href="http://example.com">example-1</a></h3>',
        '<h4 id="example-2"><a href="#example-2" class="headerlink" title="example"></a><a href="http://example.com">example</a></h4>',
        '<h5 id="example-2-1"><a href="#example-2-1" class="headerlink" title="example-2"></a>example-2</h5>',
        '<h1 id="example-1-2"><a href="#example-1-2" class="headerlink" title="example-1"></a><a href="#example-1-2">example-1</a></h1>',
        '<h2 id="example-3"><a href="#example-3" class="headerlink" title="example"></a><a href="#example-3">example</a></h2>',
        '<h3 id="example-4"><a href="#example-4" class="headerlink" title="example"></a><a href="#example-4">example</a></h3>',
        '<h4 id="中文"><a href="#中文" class="headerlink" title="中文"></a><a href="#中文">中文</a></h4>',
        '<h5></h5>'
      ].join(''));
    });

    it('should us link as id with anchorAlias option set to true', function() {
      ctx.config.marked.anchorAlias = 1;
      var r = renderer.bind(ctx);
      var result = r({text: body});

      result.should.eql([
        '<h1 id="example"><a href="#example" class="headerlink" title="example"></a>example</h1>',
        '<h2 id="example-1"><a href="#example-1" class="headerlink" title="example"></a>example</h2>',
        '<h3 id="example-1-1"><a href="#example-1-1" class="headerlink" title="example-1"></a><a href="http://example.com">example-1</a></h3>',
        '<h4 id="example-2"><a href="#example-2" class="headerlink" title="example"></a><a href="http://example.com">example</a></h4>',
        '<h5 id="example-2-1"><a href="#example-2-1" class="headerlink" title="example-2"></a>example-2</h5>',
        '<h1 id="example-3"><a href="#example-3" class="headerlink" title="example-1"></a><a href="#example-3">example-1</a></h1>',
        '<h2 id="example-1-2"><a href="#example-1-2" class="headerlink" title="example"></a><a href="#example-1-2">example</a></h2>',
        '<h3 id="example-anchor"><a href="#example-anchor" class="headerlink" title="example"></a><a href="#example-anchor">example</a></h3>',
        '<h4 id="chinese"><a href="#chinese" class="headerlink" title="中文"></a><a href="#chinese">中文</a></h4>',
        '<h5></h5>'
      ].join(''));
    });
  });
});
