'use strict';

require('chai').should();
const { encodeURL, escapeHTML, url_for } = require('hexo-util');
const Hexo = require('hexo');
const { join } = require('path').posix;
const { sep } = require('path');

describe('Marked renderer', () => {
  const hexo = new Hexo(__dirname, {silent: true});
  const defaultCfg = JSON.parse(JSON.stringify(Object.assign(hexo.config, {
    marked: {
      mangle: true
    }
  })));

  before(async () => {
    hexo.config.permalink = ':title';
    await hexo.init();
  });

  beforeEach(() => {
    hexo.config = JSON.parse(JSON.stringify(defaultCfg));
  });

  const r = require('../lib/renderer').bind(hexo);

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
      '<pre><code>' + escapeHTML(code) + '\n</code></pre>\n',
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

  it('should render headings with links - parentheses', () => {
    const body = '## [hexo-server](https://github.com/hexojs/hexo-server)';

    const result = r({text: body});

    result.should.eql([
      '<h2 id="hexo-server"><a href="#hexo-server" class="headerlink" title="hexo-server"></a>',
      '<a href="https://github.com/hexojs/hexo-server">hexo-server</a></h2>'
    ].join(''));
  });

  it('should use unescaped heading text https://github.com/hexojs/hexo-renderer-marked/issues/246', () => {
    const body = '## 1.1 aaa/bbb';

    const result = r({ text: body });

    result.should.eql('<h2 id="1-1-aaa-bbb"><a href="#1-1-aaa-bbb" class="headerlink" title="1.1 aaa&#x2F;bbb"></a>1.1 aaa&#x2F;bbb</h2>');
  });

  describe('anchorAlias', () => {
    beforeEach(() => { hexo.config.marked.anchorAlias = true; });

    it('default', () => {
      const body = '## [foo](#alias)';

      const result = r({text: body});
      result.should.eql('<h2 id="alias"><a href="#alias" class="headerlink" title="foo"></a><a href="#alias">foo</a></h2>');
    });

    it('duplicate anchors', () => {
      const body = [
        '## [foo](#alias)',
        '## [bar](#alias)'
      ].join('\n');

      const result = r({text: body});
      result.should.eql([
        '<h2 id="alias"><a href="#alias" class="headerlink" title="foo"></a><a href="#alias">foo</a></h2>',
        '<h2 id="alias-1"><a href="#alias-1" class="headerlink" title="bar"></a><a href="#alias-1">bar</a></h2>'
      ].join(''));
    });

    it('modifyAnchors', () => {
      hexo.config.marked.modifyAnchors = 2;
      const body = '## [foo](#alias)';

      const result = r({text: body});
      result.should.eql('<h2 id="ALIAS"><a href="#ALIAS" class="headerlink" title="foo"></a><a href="#ALIAS">foo</a></h2>');
    });
  });


  it('should handle duplicate headings properly', () => {
    const body = [
      '## foo',
      '## foo'
    ].join('\n');

    const result = r({text: body});

    result.should.eql([
      '<h2 id="foo"><a href="#foo" class="headerlink" title="foo"></a>foo</h2>',
      '<h2 id="foo-1"><a href="#foo-1" class="headerlink" title="foo"></a>foo</h2>'
    ].join(''));
  });

  it('should handle chinese headers properly', () => {
    const body = '# 中文';
    const result = r({text: body});

    result.should.eql('<h1 id="中文"><a href="#中文" class="headerlink" title="中文"></a>中文</h1>');
  });

  it('should render headings without headerIds when disabled', () => {
    const body = '## hexo-server';
    hexo.config.marked.headerIds = false;

    const result = r({text: body});

    result.should.eql([
      '<h2>hexo-server</h2>'
    ].join(''));
  });

  // Description List tests
  it('shouldn\'t render description lists when options.descriptionLists is disabled', () => {
    hexo.config.marked.descriptionLists = false;

    const result = r({text: 'Description Term<br>: This is the Description'});
    result.should.eql('<p>Description Term<br>: This is the Description</p>\n');
  });

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

  it('shouldn\'t encode when not a valid URL', () => {
    const url = 'http://localhost:4000你好';

    const body = `[foo](${url})`;

    const result = r({text: body});

    result.should.eql(`<p><a href="${url}">foo</a></p>\n`);
  });

  describe('quotes', () => {
    beforeEach(() => {
      hexo.config.marked.smartypants = true;
    });

    it('default', () => {
      const body = '"foo" \'bar\'';
      const quotes = '«»“”';
      hexo.config.marked.quotes = quotes;

      const result = r({text: body});

      result.should.eql('<p>«foo» “bar”</p>\n');
    });

    it('invalid option', () => {
      const body = '"foo" \'bar\'';
      const quotes = '«»';
      hexo.config.marked.quotes = quotes;

      const result = r({text: body});

      result.should.eql('<p>“foo” ‘bar’</p>\n');
    });

    it('smartypants disabled', () => {
      const body = '"foo" \'bar\'';
      const quotes = '«»“”';
      hexo.config.marked = { quotes, smartypants: false };

      const result = r({text: body});

      result.should.eql(`<p>${escapeHTML(body)}</p>\n`);
    });

    it('should render other markdown syntax - quotes disabled', () => {
      const body = '"[\'foo\'](bar)"\n["foo"](bar)\n ## "foo"\n!["joe"](bar)\n"foo---bar"';
      const result = r({text: body});

      const expected = [
        '<p>',
        '“<a href="bar">‘foo’</a>“\n',
        '<a href="bar">“foo”</a></p>\n',
        '<h2 id="“foo”"><a href="#“foo”" class="headerlink" title="“foo”"></a>“foo”</h2>',
        '<p>',
        '<img src="bar" alt="&quot;joe&quot;">\n',
        '“foo—bar”',
        '</p>\n'
      ].join('');

      result.should.eql(expected);
    });

    it('should render other markdown syntax', () => {
      const body = '"[\'foo\'](bar)"\n["foo"](bar)\n ## "foo"\n!["joe"](bar)\n"foo---bar"';
      const quotes = '«»“”';
      hexo.config.marked.quotes = quotes;
      const result = r({text: body});

      const expected = [
        '<p>',
        '«<a href="bar">“foo”</a>«\n',
        '<a href="bar">«foo»</a></p>\n',
        '<h2 id="«foo»"><a href="#«foo»" class="headerlink" title="«foo»"></a>«foo»</h2>',
        '<p>',
        '<img src="bar" alt="&quot;joe&quot;">\n',
        '«foo—bar»',
        '</p>\n'
      ].join('');

      result.should.eql(expected);
    });

    it('inRawBlock - quotes disabled', () => {
      const body = '<kbd class="foo">ctrl</kbd>"bar"';
      const result = r({text: body});

      result.should.eql('<p><kbd class="foo">ctrl</kbd>“bar”</p>\n');
    });

    it('inRawBlock - quotes disabled + wrapped', () => {
      const body = '"<kbd class="foo">ctrl</kbd>"';
      const result = r({text: body});

      result.should.eql('<p>“<kbd class="foo">ctrl</kbd>“</p>\n');
    });

    it('inRawBlock ', () => {
      const quotes = '«»“”';
      hexo.config.marked.quotes = quotes;
      const body = '<kbd class="foo">ctrl</kbd>"bar"';
      const result = r({text: body});

      result.should.eql('<p><kbd class="foo">ctrl</kbd>«bar»</p>\n');
    });

    it('inRawBlock - wrapped', () => {
      const quotes = '«»“”';
      hexo.config.marked.quotes = quotes;
      const body = '"<kbd class="foo">ctrl</kbd>"';
      const result = r({text: body});

      result.should.eql('<p>«<kbd class="foo">ctrl</kbd>«</p>\n');
    });
  });

  describe('autolink option tests', () => {
    beforeEach(() => { hexo.config.marked.autolink = true; });

    const body = [
      'Great website http://hexo.io',
      '',
      'A webpage www.example.com',
      '',
      '[Hexo](http://hexo.io)',
      '',
      '[http://lorem.com/foo/](http://lorem.com/foo/)',
      '',
      '<http://dolor.com>'
    ].join('\n');

    it('autolink enabled', () => {
      let result = r({text: body});
      const expected = [
        '<p>Great website <a href="http://hexo.io/">http://hexo.io</a></p>',
        '<p>A webpage <a href="http://www.example.com/">www.example.com</a></p>',
        '<p><a href="http://hexo.io/">Hexo</a></p>',
        '<p><a href="http://lorem.com/foo/">http://lorem.com/foo/</a></p>',
        '<p><a href="http://dolor.com/">http://dolor.com</a></p>'
      ].join('\n') + '\n';

      result.should.eql(expected);

      // try again
      result = r({text: body});

      result.should.eql(expected);
    });

    it('autolink disabled', () => {
      hexo.config.marked.autolink = false;
      const result = r({text: body});

      result.should.eql([
        '<p>Great website http://hexo.io</p>',
        '<p>A webpage www.example.com</p>',
        '<p><a href="http://hexo.io/">Hexo</a></p>',
        '<p><a href="http://lorem.com/foo/">http://lorem.com/foo/</a></p>',
        '<p><a href="http://dolor.com/">http://dolor.com</a></p>'
      ].join('\n') + '\n');
    });

    it('should not stack overflow', function() {
      this.timeout(5000);
      const body = 'Great website http://hexo.io';

      (() => {
        for (let i = 0; i < 100000; i++) {
          r({text: body});
        }
      }).should.not.throw();
    });
  });

  describe('mangle', () => {
    const body = 'Contact: hi@example.com';
    const expected = '<p>Contact: <a href="mailto:hi@example.com">hi@example.com</a></p>\n';
    // https://stackoverflow.com/a/39243641
    const unescape = str => {
      return str.replace(/&([^;]+);/g, (entity, entityCode) => {
        const hex = entityCode.match(/^#x([\da-fA-F]+)$/);
        const digit = entityCode.match(/^#(\d+)$/);

        if (hex) {
          return String.fromCharCode(parseInt(hex[1], 16));
        } else if (digit) {
          return String.fromCharCode(~~digit[1]);
        }
        return entity;

      });
    };

    // mangle option only applies to autolinked email address
    beforeEach(() => { hexo.config.marked.autolink = true; });

    it('default', () => {
      const result = r({text: body});

      result.should.include('&#');
      unescape(result).should.eql(expected);
    });

    it('disabled', () => {
      hexo.config.marked.mangle = false;
      const result = r({text: body});

      result.should.eql(expected);
    });
  });

  it('should render link with title', () => {
    const body = [
      '[text](http://link.com/ "a-title")',
      '[a<b](http://link.com/ "b>a")'
    ].join('\n');
    const result = r({ text: body });

    result.should.eql([
      '<p><a href="http://link.com/" title="a-title">text</a>',
      '<a href="http://link.com/" title="b&gt;a">a&lt;b</a></p>\n'
    ].join('\n'));
  });

  describe('sanitizeUrl option tests', () => {
    const body = [
      '[script](javascript:foo)',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('sanitizeUrl enabled', () => {
      hexo.config.marked.sanitizeUrl = true;
      const result = r({text: body});

      result.should.eql([
        '<p><a href="">script</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });

    it('sanitizeUrl disabled', () => {
      hexo.config.marked.sanitizeUrl = false;
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

    const hexo = new Hexo(__dirname, {silent: true});
    const ctx = Object.assign(hexo, {
      config: {
        marked: {
          modifyAnchors: 0
        }
      }
    });

    it('should not modify anchors with default options', () => {
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href="#example">Example</a></li>',
        '</ul>',
        '<h1 id="Example"><a href="#Example" class="headerlink" title="Example"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to upperCase in case of modifyAnchors option is 2', () => {
      ctx.config.marked.modifyAnchors = 2;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<ul>',
        '<li><a href="#example">Example</a></li>',
        '</ul>',
        '<h1 id="EXAMPLE"><a href="#EXAMPLE" class="headerlink" title="Example"></a>Example</h1>'
      ].join('\n'));
    });

    it('should set anchors to lowerCase in case of modifyAnchors option is 1', () => {
      ctx.config.marked.modifyAnchors = 1;
      const r = renderer.bind(ctx);
      const result = r({text: body});

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
    });

    it('should prepend image path with root', () => {
      ctx.config.marked.prependRoot = true;
      const r = renderer.bind(ctx);
      const result = r({text: body});

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

    it('disable', () => {
      const body = '[foo](http://bar.com/)';

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

      const result = r({text: body});

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

    it('disable', () => {
      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('enable', () => {
      ctx.config.marked.external_link.nofollow = true;

      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/" rel="noopener external nofollow noreferrer">bar</a>',
        '<a href="http://baz.com/" rel="noopener external nofollow noreferrer">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('exclude - string', () => {
      ctx.config.marked.external_link.nofollow = true;
      ctx.config.marked.external_link.exclude = 'bar.com';

      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/" rel="noopener external nofollow noreferrer">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('exclude - array', () => {
      ctx.config.marked.external_link.nofollow = true;
      ctx.config.marked.external_link.exclude = ['bar.com', 'baz.com'];

      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/">bar</a>',
        '<a href="http://baz.com/">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
      ].join('\n'));
    });

    it('nofollow + external_link', () => {
      ctx.config.marked.external_link.nofollow = true;
      ctx.config.marked.external_link.enable = true;

      const result = r({text: body});

      result.should.eql([
        '<p><a href="http://foo.com/" target="_blank" rel="noopener external nofollow noreferrer">foo</a>',
        '<a href="http://bar.com/" target="_blank" rel="noopener external nofollow noreferrer">bar</a>',
        '<a href="http://baz.com/" target="_blank" rel="noopener external nofollow noreferrer">baz</a>',
        '<a href="http://example.com/">internal</a>',
        '<a href="/foo/bar">relative</a></p>\n'
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

    const r = require('../lib/renderer').bind(hexo);

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

    const r = require('../lib/renderer').bind(hexo);

    const result = r({text: body});

    result.should.eql([
      '<p><img src="http://foo.com/a.jpg" alt="caption">',
      '<img src="http://bar.com/b.jpg" alt="caption" title="a-title">',
      '<img src="http://bar.com/b.jpg" alt="a&quot;b" title="c&gt;d"></p>\n'
    ].join('\n'));
  });

  it('lazyload image', () => {
    const body = [
      '![](/bar/baz.jpg)',
      '![foo](/aaa/bbb.jpg)'
    ].join('\n');

    hexo.config.marked.lazyload = true;

    const r = require('../lib/renderer').bind(hexo);

    const result = r({ text: body });

    result.should.eql([
      '<p><img src="/bar/baz.jpg" loading="lazy">',
      '<img src="/aaa/bbb.jpg" alt="foo" loading="lazy"></p>\n'
    ].join('\n'));
  });

  it('figcaption', () => {
    const body = [
      '![](/bar/baz.jpg "bar")',
      '![foo](/bar/baz.jpg "bar")',
      '![foo](/aaa/bbb.jpg)'
    ].join('\n');

    hexo.config.marked.figcaption = true;

    const r = require('../lib/renderer').bind(hexo);

    const result = r({ text: body });

    result.should.eql([
      '<p><img src="/bar/baz.jpg" title="bar">',
      '<figure><img src="/bar/baz.jpg" alt="foo" title="bar"><figcaption aria-hidden="true">foo</figcaption></figure>',
      '<figure><img src="/aaa/bbb.jpg" alt="foo"><figcaption aria-hidden="true">foo</figcaption></figure></p>\n'
    ].join('\n'));
  });

  describe('postAsset', () => {
    const Post = hexo.model('Post');
    const PostAsset = hexo.model('PostAsset');

    beforeEach(() => {
      hexo.config.post_asset_folder = true;
      hexo.config.marked = {
        prependRoot: true,
        postAsset: true
      };
    });

    it('default', async () => {
      const asset = 'img/bar.svg';
      const slug = asset.replace(/\//g, sep);
      const content = `![](${asset})`;
      const post = await Post.insert({
        source: '_posts/foo.md',
        slug: 'foo'
      });
      const postasset = await PostAsset.insert({
        _id: `source/_posts/foo/${asset}`,
        slug,
        post: post._id
      });

      const expected = url_for.call(hexo, join(post.path, asset));
      const result = r({ text: content, path: post.full_source });
      result.should.eql(`<p><img src="${expected}"></p>\n`);

      // should not be Windows path
      expected.includes('\\').should.eql(false);

      await PostAsset.removeById(postasset._id);
      await Post.removeById(post._id);
    });

    it('should not modify non-post asset', async () => {
      const asset = 'bar.svg';
      const siteasset = '/logo/brand.png';
      const site = 'http://lorem.ipsum/dolor/huri.bun';
      const content = `![](${asset})\n![](${siteasset})\n![](${site})`;
      const post = await Post.insert({
        source: '_posts/foo.md',
        slug: 'foo'
      });
      const postasset = await PostAsset.insert({
        _id: `source/_posts/foo/${asset}`,
        slug: asset,
        post: post._id
      });

      const result = r({ text: content, path: post.full_source });
      result.should.eql([
        `<p><img src="${url_for.call(hexo, join(post.path, asset))}">`,
        `<img src="${siteasset}">`,
        `<img src="${site}"></p>`
      ].join('\n') + '\n');

      await PostAsset.removeById(postasset._id);
      await Post.removeById(post._id);
    });

    // #170
    it('post located in subfolder', async () => {
      const asset = 'img/bar.svg';
      const slug = asset.replace(/\//g, sep);
      const content = `![](${asset})`;
      const post = await Post.insert({
        source: '_posts/lorem/foo.md',
        slug: 'foo'
      });
      const postasset = await PostAsset.insert({
        _id: `source/_posts/lorem/foo/${asset}`,
        slug,
        post: post._id
      });

      const expected = url_for.call(hexo, join(post.path, asset));
      const result = r({ text: content, path: post.full_source });
      result.should.eql(`<p><img src="${expected}"></p>\n`);

      await PostAsset.removeById(postasset._id);
      await Post.removeById(post._id);
    });
  });

  describe('exec filter to extend', () => {
    // Clear the cache, as the filter might permanently modify the tokenizer
    // thereby affecting other test cases
    delete require.cache[require.resolve('../lib/renderer')];
    const hexo = new Hexo(__dirname, {silent: true});
    hexo.config.marked = {};

    it('should execute filter registered to marked:renderer', () => {
      hexo.extend.filter.register('marked:renderer', renderer => {
        renderer.image = function({ href }) {
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

      let result = r({text: body});
      const expected = [
        `<p><img data-src="${encodeURL(urlA)}">`,
        `<img data-src="${encodeURL(urlB)}"></p>\n`
      ].join('\n');

      result.should.eql(expected);
      // try again
      result = r({text: body});

      result.should.eql(expected);
    });

    it('should execute filter registered to marked:tokenizer', () => {
      const smartypants = str => {
        return str.replace(/---/g, '\u2014');
      };

      hexo.extend.filter.register('marked:tokenizer', tokenizer => {
        tokenizer.inlineText = function(src) {
          return {
            type: 'text',
            raw: src,
            text: smartypants(src)
          };
        };
      });

      const body = '"---"';

      const r = require('../lib/renderer').bind(hexo);

      let result = r({text: body});
      const expected = `<p>${escapeHTML(smartypants(body))}</p>\n`;
      result.should.eql(expected);
      // try again
      result = r({text: body});
      result.should.eql(expected);
    });

    it('should execute filter registered to marked:extensions', () => {
      hexo.extend.filter.register('marked:extensions', extensions => {
        extensions.push({
          name: 'blockMath',
          level: 'block',
          tokenizer(src) {
            const cap = /^\s{0,3}\$\$((?:[^\n]|\n[^\n])+?)\n{0,1}\$\$/.exec(src);

            if (cap !== null) {
              return {
                type: 'blockMath',
                raw: cap[0],
                math: cap[1]
              };
            }

            return undefined;
          },
          renderer(token) {
            return `<p class="math block">${escapeHTML(token.math)}</p>\n`;
          }
        });
      });

      const body = '$$E=mc^2$$';

      const r = require('../lib/renderer').bind(hexo);

      let result = r({text: body});
      const expected = `<p class="math block">${escapeHTML('E=mc^2')}</p>\n`;
      result.should.eql(expected);
      // try again
      result = r({text: body});
      result.should.eql(expected);
    });
  });

  describe('nunjucks', () => {
    const hexo = new Hexo(__dirname, { silent: true });
    const loremFn = () => { return 'ipsum'; };
    const engine = 'md';

    before(async () => {
      await hexo.init();
      hexo.extend.tag.register('lorem', loremFn);
      hexo.extend.renderer.register('md', 'html', require('../lib/renderer'), true);
    });

    beforeEach(() => { hexo.config.marked = {}; });

    it('default', async () => {
      const result = await hexo.post.render(null, { content: '**foo** {% lorem %}', engine });
      result.content.should.eql('<p><strong>foo</strong> ipsum</p>\n');
    });

    it('enable disableNunjucks', async () => {
      const renderer = hexo.render.renderer.get('md');
      renderer.disableNunjucks = true;
      hexo.extend.renderer.register('md', 'html', renderer, true);
      const result = await hexo.post.render(null, { content: '**foo** {% lorem %}', engine });
      result.content.should.eql('<p><strong>foo</strong> {% lorem %}</p>\n');
    });
  });

  describe('sanitize HTML with DOMPurify', () => {
    const body = [
      '**safe markdown**',
      '',
      '<a onclick="alert(1)">unsafe link</a>',
      '',
      '[Hexo](http://hexo.io)'
    ].join('\n');

    it('sanitize enabled, default options', () => {
      hexo.config.marked.dompurify = true;
      const result = r({text: body});

      result.should.eql([
        '<p><strong>safe markdown</strong></p>\n',
        '<p><a>unsafe link</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });

    it('sanitize enabled, with options', () => {
      hexo.config.marked.dompurify = { FORBID_TAGS: ['strong'] };
      const result = r({text: body});

      result.should.eql([
        '<p>safe markdown</p>\n',
        '<p><a>unsafe link</a></p>\n',
        '<p><a href="http://hexo.io/">Hexo</a></p>\n'
      ].join(''));
    });
  });
});
