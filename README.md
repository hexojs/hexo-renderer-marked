# hexo-renderer-marked

[![Build Status](https://github.com/hexojs/hexo-renderer-marked/workflows/Tester/badge.svg?branch=master)](https://github.com/hexojs/hexo-renderer-marked/actions?query=workflow%3ATester)
[![NPM version](https://badge.fury.io/js/hexo-renderer-marked.svg)](https://www.npmjs.com/package/hexo-renderer-marked)
[![Coverage Status](https://img.shields.io/coveralls/hexojs/hexo-renderer-marked.svg)](https://coveralls.io/r/hexojs/hexo-renderer-marked?branch=master)
[![NPM Dependencies](https://img.shields.io/librariesio/release/npm/hexo-renderer-marked.svg)](https://libraries.io/npm/hexo-renderer-marked)

Add support for [Markdown]. This plugin uses [marked] as its render engine.

## Important note on security

By default, this plugin contains a potential security issue: **It is possible to inject Markdown containing Unsafe HTML that will not be sanitized**

This issue might not affect you because you checked the content of the markdown before using this plugin, but it's still a risk

There are two solutions to avoid those issues:

1. First solution is to enable option `dompurify: true`, which will sanitize the rendered HTML. The side effect of this solution is that it will break any [tag plugin](https://hexo.io/docs/tag-plugins) (aka `{% codeblock %}`). This explains why the safer option has not been enabled by default
2. Second solution is to migrate to [hexo-renderer-markdown-it](https://github.com/hexojs/hexo-renderer-markdown-it/) which is safe by default and does not suffer from the same limitations

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
  quotes: '“”‘’'
  modifyAnchors: 0
  anchorAlias: false
  autolink: true
  mangle: true
  sanitizeUrl: false
  dompurify: false
  headerIds: true
  lazyload: false
  prependRoot: true
  postAsset: false
  external_link:
    enable: false
    exclude: []
    nofollow: false
  disableNunjucks: false
  descriptionLists: true
```

- **gfm** - Enables [GitHub flavored markdown](https://help.github.com/articles/github-flavored-markdown)
- **pedantic** - Conform to obscure parts of `markdown.pl` as much as possible. Don't fix any of the original markdown bugs or poor behavior.
- **breaks** - Enable GFM [line breaks](https://help.github.com/articles/github-flavored-markdown#newlines). This option requires the `gfm` option to be true.
- **smartLists** - Use smarter list behavior than the original markdown.
- **smartypants** - Use "smart" typographic punctuation for things like quotes and dashes.
- **quotes** - Defines the double and single quotes used for substituting regular quotes if **smartypants** is enabled.
  * Example: '«»“”'
    * "double" will be turned into «double»
    * 'single' will be turned into “single”
  * Both double and single quotes substitution must be specified, otherwise it will be silently ignored.
- **modifyAnchors** - Transform the anchorIds into lower case (`1`) or upper case (`2`).
- **autolink** - Enable autolink for URLs. E.g. `https://hexo.io` will become `<a href="https://hexo.io">https://hexo.io</a>`.
- **mangle** - Escape autolinked email address with HTML character references.
  * This is to obscure email address from _basic_ crawler used by spam bot, while still readable to web browsers.
- **sanitizeUrl** - Remove URLs that start with `javascript:`, `vbscript:` and `data:`.
- **dompurify** - Enable [DOMPurify](https://github.com/cure53/DOMPurify) to be run on the rendered Markdown. See below for configuration
- **headerIds** - Insert header id, e.g. `<h1 id="value">text</h1>`. Useful for inserting anchor link to each paragraph with a heading.
- **anchorAlias** - Enables custom header id
  * Example: `## [foo](#bar)`, id will be set as "bar".
  * Requires **headerIds** to be enabled.
- **lazyload** - Lazy loading images via `loading="lazy"` attribute.
- **prependRoot** - Prepend root value to (internal) image path.
  * Example `_config.yml`:
  ``` yml
  root: /blog/
  ```
  * `![text](/path/to/image.jpg)` becomes `<img src="/blog/path/to/image.jpg" alt="text">`
- **postAsset** - Resolve post asset's image path to relative path and prepend root value when [`post_asset_folder`](https://hexo.io/docs/asset-folders) is enabled.
  * "image.jpg" is located at "/2020/01/02/foo/image.jpg", which is a post asset of "/2020/01/02/foo/".
  * `![](image.jpg)` becomes `<img src="/2020/01/02/foo/image.jpg">`
  * Requires **prependRoot** to be enabled.
- **external_link**
  * **enable** - Open external links in a new tab.
  * **exclude** - Exclude hostname. Specify subdomain when applicable, including `www`.
    - Example: `[foo](http://bar.com)` becomes `<a href="http://bar.com" target="_blank" rel="noopener">foo</a>`
  * **nofollow** - Add `rel="noopener external nofollow noreferrer"` to all external links for security, privacy and SEO. [Read more](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types). _This can be enabled regardless of `external_link.enable`_
    - Example: `[foo](http://bar.com)` becomes `<a href="http://bar.com" rel="noopener external nofollow noreferrer">foo</a>`
- **disableNunjucks**: If true, Nunjucks tags `{{ }}` or `{% %}` (usually used by [tag plugins](https://hexo.io/docs/tag-plugins)) will not be rendered.
- **descriptionLists**: Enable support for [description lists syntax](https://kramdown.gettalong.org/syntax.html#definition-lists).
  * Currently description lists syntax is not in neither [CommonMark](http://commonmark.org/) or [GFM](https://github.github.com/gfm/#task-list-items-extension-), `hexo-renderer-marked` only provides the option for backward compatibility.
  * By disabling the `descriptionLists`, markdown rendering performance will be improved by **a lot**.

For more options, see [Marked](https://marked.js.org/using_advanced#options). Due to the customizations implemented by this plugin, some of the Marked's options may not work as expected. Feel free to raise an [issue](https://github.com/hexojs/hexo-renderer-marked/issues) to us for clarification.

## Extras

### Sanitize HTML with DOMPurify

[DOMPurify](https://github.com/cure53/DOMPurify) can be enabled to sanitize the rendered HTML.

To enable it, pass an object containing the DOMPurify options:

```json
dompurify: true
```

Or you can enable specific DOMPurify options (but according to DOMPurify authors, the default options are safe):

```yml
dompurify:
  FORBID_TAGS:
  - "style"
```

See https://github.com/cure53/DOMPurify#can-i-configure-dompurify for a full reference of available options

### Definition/Description Lists

`hexo-renderer-marked` also implements description/definition lists using the same syntax as [PHP Markdown Extra][PHP Markdown Extra].

This Markdown:

```markdown
Definition Term
:    This is the definition for the term
```

will generate this HTML:

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

### Extensibility

This plugin overrides some default behaviours of how [marked] plugin renders the markdown into html, to integrate with the Hexo ecosystem. It is possible to override this plugin too, without resorting to forking the whole thing.

For example, to override how heading like `# heading text` is rendered:

``` js
hexo.extend.filter.register('marked:renderer', function(renderer) {
  const { config } = this; // Skip this line if you don't need user config from _config.yml
  renderer.heading = function(text, level) {
    // Default behaviour
    // return `<h${level}>${text}</h${level}>`;
    // outputs <h1>heading text</h1>

    // If you want to insert custom class name
    return `<h${level} class="headerlink">${text}</h${level}>`;
    // outputs <h1 class="headerlink">heading text</h1>
  }
})
```

Save the file in "scripts/" folder and run Hexo as usual.

Notice `renderer.heading = function (text, level) {` corresponds to [this line](https://github.com/hexojs/hexo-renderer-marked/blob/a93ebeb1e8cc11e754630c0a1506da9a1489b2b0/lib/renderer.js#L21). Refer to [renderer.js](https://github.com/hexojs/hexo-renderer-marked/blob/master/lib/renderer.js) on how this plugin overrides the default methods. For other methods not covered by this plugin, refer to marked's [documentation](https://marked.js.org/using_pro#renderer).

#### Tokenizer

It is also possible to customize the [tokenizer](https://marked.js.org/using_pro#tokenizer).

``` js
const { escapeHTML: escape } = require('hexo-util');

// https://github.com/markedjs/marked/blob/b6773fca412c339e0cedd56b63f9fa1583cfd372/src/Lexer.js#L8-L24
// Replace dashes only
const smartypants = (str) => {
  return str
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
};

hexo.extend.filter.register('marked:tokenizer', function(tokenizer) {
  const { smartypants: isSmarty } = this.config.marked;
  tokenizer.inlineText = function(src, inRawBlock) {
    const { rules } = this;

    // https://github.com/markedjs/marked/blob/b6773fca412c339e0cedd56b63f9fa1583cfd372/src/Tokenizer.js#L643-L658
    const cap = rules.inline.text.exec(src);
    if (cap) {
      let text;
      if (inRawBlock) {
        text = cap[0];
      } else {
        text = escape(isSmarty ? smartypants(cap[0]) : cap[0]);
      }
      return {
        // `type` value is a corresponding renderer method
        // https://marked.js.org/using_pro#inline-level-renderer-methods
        type: 'text',
        raw: cap[0],
        text
      };
    }
  }
});
```

#### Extensions

It is also possible to customize the [extensions](https://marked.js.org/using_pro#extensions).
For example, use [KaTeX](https://katex.org/) to render block-level math:

```js
const katex = require('katex');

hexo.extend.filter.register('marked:extensions', function(extensions) {
  // Info: `extensions` is an array.
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
      return `<p>${katex.renderToString(token.math, {displayMode: true})}</p>\n`;
    }
  });
});
```

[Markdown]: https://daringfireball.net/projects/markdown/
[marked]: https://github.com/chjj/marked
[PHP Markdown Extra]: https://michelf.ca/projects/php-markdown/extra/#def-list
