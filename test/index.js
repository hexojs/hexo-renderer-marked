'use strict';

require('chai').should();
const { encodeURL, escapeHTML } = require('hexo-util');
const Hexo = require('hexo');

describe('Marked renderer', () => {
  const hexo = new Hexo(__dirname, {silent: true});
  const ctx = Object.assign(hexo, {
    config: {
      marked: {}
    }
  });

  const r = require('../lib/renderer').bind(hexo);

  it('default', async () => {
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

    const result = await r({text: body});

    result.should.eql([
      '<h1 id="Hello-world"><a href="#Hello-world" class="headerlink" title="Hello world"></a>Hello world</h1>',
      '<pre><code>' + escapeHTML(code) + '</code></pre>',
      '<h2 id="Hello-world-1"><a href="#Hello-world-1" class="headerlink" title="Hello world"></a>Hello world</h2>',
      '<p>hello</p>'
    ].join('') + '\n');
  });

  it('should render headings with links', async () => {
    const body = [
      '## [hexo-server]',
      '',
      '[hexo-server]: https://github.com/hexojs/hexo-server'
    ].join('\n');

    const result = await r({text: body});

    result.should.eql([
      '<h2 id="hexo-server"><a href="#hexo-server" class="headerlink" title="hexo-server"></a>',
      '<a href="https://github.com/hexojs/hexo-server">hexo-server</a></h2>'
    ].join(''));
  });

  it('should render headings with links - parentheses', async () => {
    const body = '## [hexo-server](https://github.com/hexojs/hexo-server)';

    const result = await r({text: body});

    result.should.eql([
      '<h2 id="hexo-server"><a href="#hexo-server" class="headerlink" title="hexo-server"></a>',
      '<a href="https://github.com/hexojs/hexo-server">hexo-server</a></h2>'
    ].join(''));
  });

  it('should handle duplicate headings properly', async () => {
    const body = [
      '## foo',
      '## foo'
    ].join('\n');

    const result = await r({text: body});

    result.should.eql([
      '<h2 id="foo"><a href="#foo" class="headerlink" title="foo"></a>foo</h2>',
      '<h2 id="foo-1"><a href="#foo-1" class="headerlink" title="foo"></a>foo</h2>'
    ].join(''));
  });

  it('should handle chinese headers properly', async () => {
    const body = '# 中文';
    const result = await r({text: body});

    result.should.eql('<h1 id="中文"><a href="#中文" class="headerlink" title="中文"></a>中文</h1>');
  });

  it('should render headings without headerIds when disabled', async () => {
    const body = '## hexo-server';
    ctx.config.marked.headerIds = false;

    const result = await r({text: body});

    result.should.eql([
      '<h2>hexo-server</h2>'
    ].join(''));
  });

  // Description List tests

  it('should render description lists with a single space after the colon', async () => {
    const result = await r({text: 'Description Term<br>: This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with multiple spaces after the colon', async () => {
    const result = await r({text: 'Description Term<br>:    This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with a tab after the colon', async () => {
    const result = await r({text: 'Description Term<br>:	This is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should render description lists with a carriage return after the colon', async () => {
    const result = await r({text: 'Description Term<br>:\nThis is the Description'});
    result.should.eql('<dl><dt>Description Term</dt><dd>This is the Description</dd></dl>');
  });

  it('should not render regular paragraphs as description lists', async () => {
    const result = await r({text: 'Description Term<br>:This is the Description'});
    result.should.eql('<p>Description Term<br>:This is the Description</p>\n');
  });

  it('should encode URL properly', async () => {
    const urlA = '/foo/bár.jpg';
    const urlB = 'http://fóo.com/bar.jpg';

    const body = [
      `[foo](${urlA})`,
      `[bar](${urlB})`
    ].join('\n');

    const result = await r({text: body});

    result.should.eql([
      `<p><a href="${encodeURL(urlA)}">foo</a>`,
      `<a href="${encodeURL(urlB)}">bar</a></p>\n`
    ].join('\n'));
  });

  describe('autolink option tests', () => {
    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          autolink: true
        }
      }
    });

    const r = require('../lib/renderer').bind(ctx);

    const body = [
      'Great website http://hexo.io',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('autolink enabled', async () => {
      const result = await r({text: body});

      result.should.eql([
        '<p>Great website <a href="http://hexo.io/">http://hexo.io</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });

    it('autolink disabled', async () => {
      ctx.config.marked.autolink = false;
      const result = await r({text: body});

      result.should.eql([
        '<p>Great website http://hexo.io</p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });
  });

  it('should render link with title', async () => {
    const body = [
      '[text](http://link.com/ "a-title")',
      '[a<b](http://link.com/ "b>a")'
    ].join('\n');
    const result = await r({ text: body });

    result.should.eql([
      '<p><a href="http://link.com/" title="a-title">text</a>',
      '<a href="http://link.com/" title="b&gt;a">a&lt;b</a></p>\n'
    ].join('\n'));
  });

  describe('sanitizeUrl option tests', () => {
    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          sanitizeUrl: true
        }
      }
    });

    const renderer = require('../lib/renderer');

    const body = [
      '[script](javascript:foo)',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('sanitizeUrl enabled', async () => {
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<p><a href="">script</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });

    it('sanitizeUrl disabled', async () => {
      ctx.config.marked.sanitizeUrl = false;
      const r = renderer.bind(ctx);
      const result = await r({text: body});

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

    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          modifyAnchors: 0
        }
      }
    });

    it('should not modify anchors with default options', async () => {
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href="#example">Example</a></li>',
        '</ul>',
        '<h1 id="Example"><a href="#Example" class="headerlink" title="Example"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to upperCase in case of modifyAnchors option is 2', async () => {
      ctx.config.marked.modifyAnchors = 2;
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href="#example">Example</a></li>',
        '</ul>',
        '<h1 id="EXAMPLE"><a href="#EXAMPLE" class="headerlink" title="Example"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to lowerCase in case of modifyAnchors option is 1', async () => {
      ctx.config.marked.modifyAnchors = 1;
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href="#example">Example</a></li>',
        '</ul>',
        '<h1 id="example"><a href="#example" class="headerlink" title="Example"></a>Example</h1>'
      ].join('\n'));
    });
  });

  describe('prependRoot option tests', () => {
    const body = [
      '![](/bar/baz.jpg)',
      '![foo](/aaa/bbb.jpg)'
    ].join('\n');

    const renderer = require('../lib/renderer');

    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          prependRoot: false
        },
        url: 'http://example.com',
        root: '/blog/',
        relative_link: false
      }
    });

    afterEach(() => {
      ctx.config = {
        marked: {
          prependRoot: false
        },
        url: 'http://example.com',
        root: '/blog/',
        relative_link: false
      };
    });

    it('should not modify image path with default option', async () => {
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<p><img src="/bar/baz.jpg">',
        '<img src="/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
    });

    it('should not modify image path when enable relative_link', async () => {
      ctx.config.relative_link = true;
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<p><img src="/bar/baz.jpg">',
        '<img src="/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
    });

    it('should prepend image path with root', async () => {
      ctx.config.marked.prependRoot = true;
      const r = renderer.bind(ctx);
      const result = await r({text: body});

      result.should.eql([
        '<p><img src="/blog/bar/baz.jpg">',
        '<img src="/blog/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
    });
  });

  describe('external_link', () => {
    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          external_link: {
            enable: false
          }
        },
        url: 'http://example.com'
      }
    });
    const r = require('../lib/renderer').bind(ctx);

    it('disable', async () => {
      const body = '[foo](http://bar.com/)';

      const result = await r({text: body});

      result.should.eql('<p><a href="http://bar.com/">foo</a></p>\n');
    });

    it('enable', async () => {
      ctx.config.marked.external_link.enable = true;
      const body = [
        '[foo](http://bar.com/)',
        '[text](http://example.com/)',
        '[baz](/foo/bar)'
      ].join('\n');

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://bar.com/" target="_blank" rel="noopener">foo</a>',
        '<a href="http://example.com/">text</a>',
        '<a href="/foo/bar">baz</a></p>\n'
      ].join('\n'));
    });

    it('exclude - string', async () => {
      ctx.config.marked.external_link.exclude = 'bar.com';
      const body = [
        '[foo](http://foo.com/)',
        '[bar](http://bar.com/)',
        '[baz](http://baz.com/)'
      ].join('\n');

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" target="_blank" rel="noopener">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/" target="_blank" rel="noopener">baz</a></p>\n'
      ].join('\n'));
    });

    it('exclude - array', async () => {
      ctx.config.marked.external_link.exclude = ['bar.com', 'baz.com'];
      const body = [
        '[foo](http://foo.com/)',
        '[bar](http://bar.com/)',
        '[baz](http://baz.com/)'
      ].join('\n');

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" target="_blank" rel="noopener">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/">baz</a></p>\n'
      ].join('\n'));
    });
  });

  describe('nofollow', () => {
    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          external_link: {
            enable: false,
            exclude: [],
            nofollow: false
          }
        },
        url: 'http://example.com'
      }
    });
    const r = require('../lib/renderer').bind(ctx);

    afterEach(() => {
      ctx.config = {
        marked: {
          external_link: {
            enable: false,
            exclude: [],
            nofollow: false
          }
        },
        url: 'http://example.com'
      };
    });

    const body = [
      '[foo](http://foo.com/)',
      '[bar](http://bar.com/)',
      '[baz](http://baz.com/)',
      '[internal](http://example.com/)',
      '[relative](/foo/bar)'
    ].join('\n');

    it('disable', async () => {
      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('enable', async () => {
      ctx.config.marked.external_link.nofollow = true;

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/" rel="noopener external nofollow noreferrer">bar</a>',
        '<a href="http://baz.com/" rel="noopener external nofollow noreferrer">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('exclude - string', async () => {
      ctx.config.marked.external_link.nofollow = true;
      ctx.config.marked.external_link.exclude = 'bar.com';

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/" rel="noopener external nofollow noreferrer">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('exclude - array', async () => {
      ctx.config.marked.external_link.nofollow = true;
      ctx.config.marked.external_link.exclude = ['bar.com', 'baz.com'];

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('nofollow + external_link', async () => {
      ctx.config.marked.external_link.nofollow = true;
      ctx.config.marked.external_link.enable = true;

      const result = await r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" target="_blank" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/" target="_blank" rel="noopener external nofollow noreferrer">bar</a>',
        '<a href="http://baz.com/" target="_blank" rel="noopener external nofollow noreferrer">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });
  });

  it('should encode image url', async () => {
    const urlA = '/foo/bár.jpg';
    const urlB = 'http://fóo.com/bar.jpg';

    const body = [
      `![](${urlA})`,
      `![](${urlB})`
    ].join('\n');

    const r = require('../lib/renderer').bind(ctx);

    const result = await r({text: body});

    result.should.eql([
      `<p><img src="${encodeURL(urlA)}">`,
      `<img src="${encodeURL(urlB)}"></p>\n`
    ].join('\n'));
  });

  it('should include image caption & title', async () => {
    const body = [
      '![caption](http://foo.com/a.jpg)',
      '![caption](http://bar.com/b.jpg "a-title")',
      '![a"b](http://bar.com/b.jpg "c>d")'
    ].join('\n');

    const r = require('../lib/renderer').bind(ctx);

    const result = await r({text: body});

    result.should.eql([
      '<p><img src="http://foo.com/a.jpg" alt="caption">',
      '<img src="http://bar.com/b.jpg" alt="caption" title="a-title">',
      '<img src="http://bar.com/b.jpg" alt="a&quot;b" title="c&gt;d"></p>\n'
    ].join('\n'));
  });

  describe('exec filter to extend', () => {
    it('should execute filter registered to marked:renderer', async () => {
      const hexo = new Hexo(__dirname, {silent: true});
      hexo.extend.filter.register('marked:renderer', renderer => {
        renderer.image = function(href, title, text) {
          return `<img data-src="${encodeURL(href)}">`;
        };
      });

      const urlA = '/foo/bár.jpg';
      const urlB = 'http://fóo.com/bar.jpg';

      const body = [
        `![](${urlA})`,
        `![](${urlB})`
      ].join('\n');

      const r = require('../lib/renderer').bind(hexo);

      const result = await r({text: body});

      result.should.eql([
        `<p><img data-src="${encodeURL(urlA)}">`,
        `<img data-src="${encodeURL(urlB)}"></p>\n`
      ].join('\n'));
    });
  });
});
