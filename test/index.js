'use strict';

const should = require('chai').should(); // eslint-disable-line
const util = require('hexo-util');

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
      '<pre><code>' + util.highlight(code, {gutter: false, wrap: false}) + '</code></pre>',
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
        '<p>Great website <a href="http://hexo.io">http://hexo.io</a></p>\n',
        '<p><a href="http://hexo.io">Hexo</a></p>\n'
      ].join(''));
    });

    it('autolink disabled', () => {
      ctx.config.marked.autolink = false;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p>Great website http://hexo.io</p>\n',
        '<p><a href="http://hexo.io">Hexo</a></p>\n'
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
        '<p><img src="/bar/baz.jpg" alt="">',
        '<img src="/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
    });

    it('should not modify image path when enable relative_link', () => {
      ctx.config.relative_link = true;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><img src="/bar/baz.jpg" alt="">',
        '<img src="/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));

      ctx.config.relative_link = false;
    });

    it('should prepend image path with root', () => {
      ctx.config.marked.prependRoot = true;
      const r = renderer.bind(ctx);
      const result = r({text: body});

      result.should.eql([
        '<p><img src="/blog/bar/baz.jpg" alt="">',
        '<img src="/blog/aaa/bbb.jpg" alt="foo"></p>\n'
      ].join('\n'));
      ctx.config.marked.prependRoot = false;
    });
  });

  it('should encode image url', () => {
    const body = [
      '![](/foo/bár.jpg)',
      '![](http://fóo.com/bar.jpg)'
    ].join('\n');

    const renderer = require('../lib/renderer');
    const r = renderer.bind(ctx);

    const result = r({text: body});

    result.should.eql([
      '<p><img src="/foo/b%C3%A1r.jpg" alt="">',
      '<img src="http://xn--fo-5ja.com/bar.jpg" alt=""></p>\n'
    ].join('\n'));
  });
});
