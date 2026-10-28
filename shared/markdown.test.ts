import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { markdownExcerpt, renderMarkdown } from './markdown'

it('renders Markdown, GFM tables and disabled task lists', () => {
  const html = renderMarkdown(
    '# Heading\n\n**bold** and *emphasis*, ~~gone~~, `code`\n\n- [x] done\n- [ ] later\n\n| Name | Value |\n| --- | --- |\n| key | value |',
  )
  for (const tag of ['h1', 'strong', 'em', 'del', 'code', 'table', 'thead', 'td']) {
    assert.ok(html.includes(`<${tag}`), tag)
  }
  assert.match(html, /<input[^>]*type="checkbox"[^>]*>/)
  assert.equal((html.match(/disabled/g) ?? []).length, 2)
  assert.match(html, /checked/)
})

it('renders supported raw HTML and never evaluates Vue or MDC syntax', () => {
  const html = renderMarkdown(
    '<details open><summary>Bot report</summary><p>Use <kbd>Enter</kbd>.</p></details>\n\n<SecretComponent onclick="steal()">Visible</SecretComponent>',
  )
  assert.match(html, /<details open>/)
  assert.match(html, /<summary>Bot report<\/summary>/)
  assert.match(html, /<kbd>Enter<\/kbd>/)
  assert.match(html, /Visible/)
  assert.doesNotMatch(html, /SecretComponent|secretcomponent|onclick/)
})

it('strips executable HTML, styles, embeds, event handlers and DOM-clobbering attributes', () => {
  const html = renderMarkdown(
    '<script>alert(1)</script><style>body{display:none}</style><iframe src="https://evil.example"></iframe><svg onload="steal()"><a href="javascript:alert(1)">bad</a></svg><form action="https://evil.example"><input name="secret"></form><p id="location" name="cookie" style="position:fixed" onclick="steal()">Safe</p>',
  )
  assert.match(html, /<p>Safe<\/p>/)
  assert.doesNotMatch(
    html,
    /script|alert\(1\)|style|iframe|svg|onload|onclick|form|name=|id=|steal\(\)/i,
  )
})

it('does not load images, media, or tracking pixels', () => {
  const html = renderMarkdown(
    '![tracker](https://evil.example/pixel)\n\n<img src="https://evil.example/pixel" onerror="steal()"><video poster="https://evil.example/pixel"><source src="https://evil.example/video"></video>',
  )
  assert.doesNotMatch(html, /<img|<video|<source|src=|poster=|evil\.example/)
})

it('resolves GitHub links against the source and restricts URL protocols', () => {
  const html = renderMarkdown(
    '[comment](#issuecomment-42) [file](../blob/main/README.md) [site](https://example.com) [mail](mailto:dev@example.com) <a href="jav&#x61;script:alert(1)">bad</a> <a href="file:///etc/passwd">file</a>',
    'https://github.com/acme/app/issues/7',
  )
  assert.match(html, /href="https:\/\/github.com\/acme\/app\/issues\/7#issuecomment-42"/)
  assert.match(html, /href="https:\/\/github.com\/acme\/app\/blob\/main\/README.md"/)
  assert.match(html, /target="_blank" rel="noopener noreferrer"/)
  assert.match(html, /href="mailto:dev@example.com"/)
  assert.doesNotMatch(html, /href="(?:javascript|file|data|vbscript):/i)
  assert.doesNotMatch(
    renderMarkdown('[relative](./private) <a href="//evil.example">relative</a>'),
    /href=/,
  )
})

it('keeps code literal instead of interpreting it as HTML', () => {
  const html = renderMarkdown('```html\n<script>alert(1)</script>\n```')
  assert.match(html, /<pre><code>/)
  assert.match(html, /&#x3C;script>|&lt;script>/)
  assert.doesNotMatch(html, /<script>/)
})

it('extracts readable bounded summaries without HTML, quoted history or fenced code', () => {
  assert.equal(
    markdownExcerpt(
      '> old reply\n\n<details><summary>Report</summary><p>Use <strong>this fix</strong> &amp; retry.</p></details>\n\n```js\nignored()\n```',
    ),
    'Report Use this fix & retry.',
  )
  assert.equal(
    markdownExcerpt('Hello **world**, `code` and [a link](https://example.com).'),
    'Hello world, code and a link.',
  )
  assert.equal(markdownExcerpt('> quote only'), undefined)
  assert.equal(markdownExcerpt('<script>steal()</script>'), undefined)
  assert.equal(markdownExcerpt(''), undefined)
  assert.equal(Array.from(markdownExcerpt('😀'.repeat(200))!).length, 140)
})

it('handles malformed and adversarial markup without exposing executable attributes', () => {
  for (const body of [
    '<details><summary>Broken</summary><b>text',
    '<a href="javascript&#58;alert(1)">link',
    '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
    '<textarea><img src=x onerror=alert(1)></textarea>',
    '<input type="text" value="secret" autofocus><input type="checkbox" checked>',
  ]) {
    const html = renderMarkdown(body)
    assert.doesNotMatch(html, /<img|<math|<textarea|onerror=|autofocus|value=|href="javascript:/i)
    for (const input of html.matchAll(/<input\b[^>]*>/g)) {
      assert.match(input[0], /disabled/)
      assert.match(input[0], /type="checkbox"/)
    }
  }
})
