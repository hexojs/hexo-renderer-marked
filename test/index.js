'use strict';

require('chai').should();
const { highlight, encodeURL } = require('hexo-util');

describe('Marked renderer', () => {
  const ctx = {
    config: {
      marked: {}
    }
  };

  const r = require('../lib/renderer').bind(ctx);

  it('default', () => {
    const code = 'console.log("Hello world");';

    const body = [
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

    const result = r({text: body});

    result.should.eql([
      '<h1 id="Hello-world"><a href="#Hello-world" class="headerlink" title="Hello world"></a>Hello world</h1>',
      '<pre><code>' + highlight(code, {gutter: false, wrap: false}) + '</code></pre>',
      '<h2 id="Hello-world-1"><a href="#Hello-world-1" class="headerlink" title="Hello world"></a>Hello world</h2>',
      '<p>hello</p>'
    ].join('') + '\n');
  });

  it('should render headings with links', () => {
    const body = [
      '## [hexo-server]',
      '',
      '[hexo-server]: https://github.com/hexojs/hexo-server'
    ].join('\n');

    const result = r({text: body});

    result.should.eql([
      '<h2 id="hexo-server"><a href="#hexo-server" class="headerlink" title="hexo-server"></a>',
      '<a href="https://github.com/hexojs/hexo-server">hexo-server</a></h2>'
    ].join(''));
  });

  it('should handle chinese headers properly', () => {
    const body = '# 中文';
    const result = r({text: body});

    result.should.eql('<h1 id="中文"><a href="#中文" class="headerlink" title="中文"></a>中文</h1>');
  });

  it('should render headings without headerIds when disabled', () => {
    const body = '## hexo-server';
    ctx.config.marked.headerIds = false;

    const result = r({text: body});

    result.should.eql([
      '<h2>hexo-server</h2>'
    ].join(''));
  });

  // Description List tests

  it('should render description lists with a single space after the colon', () => {
    const result = r({text: 'Description Term<br>: This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with multiple spaces after the colon', () => {
    const result = r({text: 'Description Term<br>:    This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with a tab after the colon', () => {
    const result = r({text: 'Description Term<br>:	This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with a carriage return after the colon', () => {
    const result = r({text: 'Description Term<br>:\nThis is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should not render regular paragraphs as description lists', () => {
    const result = r({text: 'Description Term<br>:This is the Description'});
    result.should.eql('<p>Description Term<br>:This is the Description</p>\n');
  });

  it('should encode URL properly', () => {
    const urlA = '/foo/bár.jpg';
    const urlB = 'http://fóo.com/bar.jpg';

    const body = [
      `[foo](${urlA})`,
      `[bar](${urlB})`
    ].join('\n');

    const result = r({text: body});

    result.should.eql([
      `<p><a href="${encodeURL(urlA)}">foo</a>`,
      `<a href="${encodeURL(urlB)}">bar</a></p>\n`
    ].join('\n'));
  });

  describe('autolink option tests', () => {
    const ctx = {
      config: {
        marked: {
          autolink: true
        }
      }
    };

    const renderer = require('../lib/renderer');

    const body = [
      'Great website http://hexo.io',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('autolink enabled', () => {
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p>Great website <a href="http://hexo.io/">http://hexo.io</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });

    it('autolink disabled', () => {
      ctx.config.marked.autolink = false;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p>Great website http://hexo.io</p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });
  });

  it('should render link with title', () => {
    const result = r({text: '[text](http://link.com/ "a-title")'});
    result.should.eql('<p><a href="http://link.com/" title="a-title">text</a></p>\n');
  });

  describe('sanitizeUrl option tests', () => {
    const ctx = {
      config: {
        marked: {
          sanitizeUrl: true
        }
      }
    };

    const renderer = require('../lib/renderer');

    const body = [
      '[script](javascript:foo)',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('sanitizeUrl enabled', () => {
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><a href="">script</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });

    it('sanitizeUrl disabled', () => {
      ctx.config.marked.sanitizeUrl = false;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><a href="javascript:foo">script</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });
  });

  describe('modifyAnchors option tests', () => {
    const body = [
      '- [Example](#example)',
      '',
      '# Example'
    ].join('\n');

    const renderer = require('../lib/renderer');

    const ctx = {
      config: {
        marked: {
          modifyAnchors: ''
        }
      }
    };

    it('should not modify anchors with default options', () => {
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href=\"#example\">Example</a></li>',
        '</ul>',
        '<h1 id=\"Example\"><a href=\"#Example\" class=\"headerlink\" title=\"Example\"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to upperCase in case of modifyAnchors option is 2', () => {
      ctx.config.marked.modifyAnchors = 2;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href=\"#example\">Example</a></li>',
        '</ul>',
        '<h1 id=\"EXAMPLE\"><a href=\"#EXAMPLE\" class=\"headerlink\" title=\"Example\"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to lowerCase in case of modifyAnchors option is 1', () => {
      ctx.config.marked.modifyAnchors = 1;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href=\"#example\">Example</a></li>',
        '</ul>',
        '<h1 id=\"example\"><a href=\"#example\" class=\"headerlink\" title=\"Example\"></a>Example</h1>'
      ].join('\n'));
    });
  });

  describe('prependRoot option tests', () => {
    const body = [
      '![](/bar/baz.jpg)',
      '![foo](/aaa/bbb.jpg)'
    ].join('\n');

    const renderer = require('../lib/renderer');

    const ctx = {
      config: {
        marked: {
          prependRoot: false
        },
        root: '/blog/',
        relative_link: false
      }
    };

    it('should not modify image path with default option', () => {
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><img src="/bar/baz.jpg">',
        '<img src="/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
    });

    it('should not modify image path when enable relative_link', () => {
      ctx.config.relative_link = true;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><img src="/bar/baz.jpg">',
        '<img src="/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));

      ctx.config.relative_link = false;
    });

    it('should prepend image path with root', () => {
      ctx.config.marked.prependRoot = true;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><img src="/blog/bar/baz.jpg">',
        '<img src="/blog/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
      ctx.config.marked.prependRoot = false;
    });
  });

  describe('external_link', () => {
    const renderer = require('../lib/renderer');

    const ctx = {
      config: {
        marked: {
          external_link: {
            enable: false
          }
        },
        url: 'http://example.com'
      }
    };

    it('disable', () => {
      const body = '[foo](http://bar.com/)';

      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql('<p><a href="http://bar.com/">foo</a></p>\n');
    });

    it('enable', () => {
      ctx.config.marked.external_link.enable = true;
      const body = [
        '[foo](http://bar.com/)',
        '[text](http://example.com/)',
        '[baz](/foo/bar)'
      ].join('\n');

      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://bar.com/" target="_blank" rel="noopener">foo</a>',
        '<a href="http://example.com/">text</a>',
        '<a href="/foo/bar">baz</a></p>\n'
      ].join('\n'));
    });

    it('exclude - string', () => {
      ctx.config.marked.external_link.exclude = 'bar.com';
      const body = [
        '[foo](http://foo.com/)',
        '[bar](http://bar.com/)',
        '[baz](http://baz.com/)'
      ].join('\n');

      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" target="_blank" rel="noopener">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/" target="_blank" rel="noopener">baz</a></p>\n'
      ].join('\n'));
    });

    it('exclude - array', () => {
      ctx.config.marked.external_link.exclude = ['bar.com', 'baz.com'];
      const body = [
        '[foo](http://foo.com/)',
        '[bar](http://bar.com/)',
        '[baz](http://baz.com/)'
      ].join('\n');

      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" target="_blank" rel="noopener">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/">baz</a></p>\n'
      ].join('\n'));
    });
  });

  it('should encode image url', () => {
    const urlA = '/foo/bár.jpg';
    const urlB = 'http://fóo.com/bar.jpg';

    const body = [
      `![](${urlA})`,
      `![](${urlB})`
    ].join('\n');

    const renderer = require('../lib/renderer');
    const r = renderer.bind(ctx);

    const result = r({text: body});

    result.should.eql([
      `<p><img src="${encodeURL(urlA)}">`,
      `<img src="${encodeURL(urlB)}"></p>\n`
    ].join('\n'));
  });

  it('should include image caption & title', () => {
    const body = [
      '![caption](http://foo.com/a.jpg)',
      '![caption](http://bar.com/b.jpg "a-title")',
      '![a"b](http://bar.com/b.jpg "c>d")'
    ].join('\n');

    const renderer = require('../lib/renderer');
    const r = renderer.bind(ctx);

    const result = r({text: body});

    result.should.eql([
      '<p><img src="http://foo.com/a.jpg" alt="caption">',
      '<img src="http://bar.com/b.jpg" alt="caption" title="a-title">',
      '<img src="http://bar.com/b.jpg" alt="a&quot;b" title="c&gt;d"></p>\n'
    ].join('\n'));
  });
});
