# hexo-renderer-marked

[![Build Status](https://travis-ci.org/hexojs/hexo-renderer-marked.svg?branch=master)](https://travis-ci.org/hexojs/hexo-renderer-marked)  [![NPM version](https://badge.fury.io/js/hexo-renderer-marked.svg)](https://www.npmjs.com/package/hexo-renderer-marked) [![Coverage Status](https://img.shields.io/coveralls/hexojs/hexo-renderer-marked.svg)](https://coveralls.io/r/hexojs/hexo-renderer-marked?branch=master)
[![NPM Dependencies](https://david-dm.org/hexojs/hexo-renderer-marked.svg)](https://david-dm.org/hexojs/hexo-renderer-marked)
[![NPM DevDependencies](https://david-dm.org/hexojs/hexo-renderer-marked/dev-status.svg)](https://david-dm.org/hexojs/hexo-renderer-marked?type=dev)

Add support for [Markdown]. This plugin uses [marked] as its render engine.

## Installation

``` bash
$ npm install hexo-renderer-marked --save
```

- Hexo 4: >= 2.0
- Hexo 3: >= 0.2
- Hexo 2: 0.1.x

## Options

You can configure this plugin in `_config.yml`.

``` yaml
marked:
  gfm: true
  pedantic: false
  breaks: true
  smartLists: true
  smartypants: true
  modifyAnchors: ''
  autolink: true
  sanitizeUrl: false
  headerIds: true
  prependRoot: false
```

- **gfm** - Enables [GitHub flavored markdown](https://help.github.com/articles/github-flavored-markdown)
- **pedantic** - Conform to obscure parts of `markdown.pl` as much as possible. Don't fix any of the original markdown bugs or poor behavior.
- **breaks** - Enable GFM [line breaks](https://help.github.com/articles/github-flavored-markdown#newlines). This option requires the `gfm` option to be true.
- **smartLists** - Use smarter list behavior than the original markdown.
- **smartypants** - Use "smart" typograhic punctuation for things like quotes and dashes.
- **modifyAnchors** - Use for transform anchorIds. if `1` to lowerCase and if `2` to upperCase. **Must be integer**.
- **autolink** - Enable autolink for URLs. E.g. `https://hexo.io` will become `<a href="https://hexo.io">https://hexo.io</a>`.
- **sanitizeUrl** - Remove URLs that start with `javascript:`, `vbscript:` and `data:`.
- **headerIds** - Insert header id, e.g. `<h1 id="value">text</h1>`. Useful for inserting anchor link to each paragraph with a heading.
- **headerIds** - Insert header id, e.g. `<h1 id="value">text</h1>`. Useful for inserting anchor link to each paragraph with a heading.
- **prependRoot** - Prepend root value to (internal) image path.
  * Example `_config.yml`:
  ``` yml
  root: /blog/
  ```
  * `![text](/path/to/image.jpg)` becomes `<img src="/blog/path/to/image.jpg" alt="text">`

## Extras

### Definition/Description Lists

`hexo-renderer-marked` also implements description/definition lists using the same syntax as [PHP Markdown Extra][PHP Markdown Extra].

This Markdown:

```markdown
Definition Term
:    This is the definition for the term
```

will generate this html:

```html
<dl>
  <dt>Definition Term</dt>
  <dd>This is the definition for the term</dd>
</dl>
```

Note: There is currently a limitation in this implementation. If multiple definitions are provided, the rendered HTML will be incorrect.

For example, this Markdown:

```markdown
Definition Term
:    Definition 1
:    Definition 2
```

will generate this HTML:

```html
<dl>
  <dt>Definition Term<br>: Definition 1</dt>
  <dd>Definition 2</dd>
</dl>
```

If you've got ideas on how to support multiple definitions, please provide a pull request. We'd love to support it.

[Markdown]: https://daringfireball.net/projects/markdown/
[marked]: https://github.com/chjj/marked
[PHP Markdown Extra]: https://michelf.ca/projects/php-markdown/extra/#def-list
