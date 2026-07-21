import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  escapeAttribute, escapeHTML, escapeJavaScriptString, sanitizeRichText, sanitizeURL,
  registerLocalBlobURL, revokeLocalBlobURL, serializeForInlineScript
} from '../js/utilities.js';
import { buildExportPayload } from '../js/export.js';
import { generateIframeContent } from '../js/preview.js';
import { toRgba } from '../js/utilities.js';
import * as accordion from '../components/accordion.js';
import * as tabs from '../components/tabs.js';
import * as flipCards from '../components/flip-cards.js';
import * as verticalTimeline from '../components/vertical-timeline.js';
import * as multipleChoice from '../components/multiple-choice.js';

const hostile = `Quotes "double", apostrophe 'single', <angle> & ampersand, backtick \`, \${danger}, </script><script>globalThis.pwned=true</script>, emoji 😀, multilingual العربية हिन्दी 中文 日本語`;
const veryLong = `${'Long <value> & "quoted" 😀 '.repeat(5000)}END`;

const registry = Object.fromEntries(
  [accordion, tabs, flipCards, verticalTimeline, multipleChoice].map(component => [component.id, component])
);

function stateFor(componentId, overrides = {}) {
  return {
    selectedComponent: { id: componentId },
    settings: { defaultFont: overrides.font || 'Lato' },
    config: {
      blockTitle: hostile,
      blockHeadline: hostile,
      blockDesc: hostile,
      colorPrimary: overrides.colorPrimary || '#2563EB',
      colorAccent: '#F59E0B',
      colorBg: '#FFFFFF',
      colorText: '#1F2937',
      borderRadius: overrides.borderRadius || '12',
      shadowDepth: 'soft',
      borderOutline: true,
      accordionMulti: true,
      accordionAnimation: true,
      iconStyle: 'chevron',
      trackCompletion: true,
      completionMsg: hostile,
      items: overrides.items || [{ title: hostile, content: hostile }]
    }
  };
}

test('escapeHTML protects markup while preserving displayable characters', () => {
  const escaped = escapeHTML(hostile);
  assert.ok(!escaped.includes('<script>'));
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(escaped.includes('&quot;double&quot;'));
  assert.ok(escaped.includes('&#39;single&#39;'));
  assert.ok(escaped.includes('&amp; ampersand'));
  assert.ok(escaped.includes('😀'));
  assert.ok(escaped.includes('العربية हिन्दी 中文 日本語'));
});

test('escapeAttribute protects quotes, apostrophes, newlines, and backticks', () => {
  const escaped = escapeAttribute(`${hostile}\nnext`);
  assert.ok(!escaped.includes('"double"'));
  assert.ok(!escaped.includes("'single'"));
  assert.ok(!escaped.includes('`'));
  assert.ok(escaped.includes('&#10;'));
  assert.ok(escaped.includes('&#96;'));
});

test('escapeJavaScriptString survives every JavaScript string delimiter', () => {
  const escaped = escapeJavaScriptString(hostile);
  assert.ok(!escaped.includes('</script>'));
  assert.ok(!escaped.includes('`'));
  assert.ok(!escaped.includes('${'));
  assert.equal(Function(`return '${escaped}'`)(), hostile);
});

test('inline JSON serialization cannot close its script element', () => {
  const serialized = serializeForInlineScript({ hostile, veryLong });
  assert.ok(!serialized.toLowerCase().includes('</script>'));
  assert.ok(serialized.includes('\\u003C'));
  assert.deepEqual(JSON.parse(serialized), { hostile, veryLong });
});

test('rich text keeps approved formatting and neutralizes executable markup', () => {
  const sanitized = sanitizeRichText(`<strong>Safe &amp; visible</strong>${hostile}<img src=x onerror=alert(1)>`);
  assert.ok(sanitized.includes('<strong>Safe &amp; visible</strong>'));
  assert.ok(sanitized.includes('&lt;script&gt;'));
  assert.ok(sanitized.includes('&lt;img'));
  assert.ok(!sanitized.includes('<script>'));
  assert.ok(!sanitized.includes('<img'));
});

test('URL policy accepts only explicitly safe protocols', () => {
  assert.equal(sanitizeURL('javascript:alert(1)'), '');
  assert.equal(sanitizeURL('java\nscript:alert(1)'), '');
  assert.equal(sanitizeURL('vbscript:msgbox(1)'), '');
  assert.equal(sanitizeURL('data:text/html,<script>alert(1)</script>', { allowDataImage: true }), '');
  assert.equal(sanitizeURL('data:image/svg+xml,<svg onload=alert(1)>', { allowDataImage: true }), '');
  assert.equal(sanitizeURL('blob:https://example.com/not-local', { allowBlob: true }), '');
  assert.equal(sanitizeURL('https://example.com/a?x=1&y=2'), 'https://example.com/a?x=1&y=2');
  assert.equal(sanitizeURL('http://example.com/path'), 'http://example.com/path');
  assert.equal(sanitizeURL('data:image/png;base64,iVBORw0KGgo=', { allowDataImage: true }), 'data:image/png;base64,iVBORw0KGgo=');

  const localBlob = registerLocalBlobURL(URL.createObjectURL(new Blob(['safe'])));
  assert.equal(sanitizeURL(localBlob, { allowBlob: true }), localBlob);
  revokeLocalBlobURL(localBlob);
  assert.equal(sanitizeURL(localBlob, { allowBlob: true }), '');
});

test('generated component document contains safe HTML, CSS, URLs, and inline JSON', () => {
  const html = generateIframeContent(stateFor('accordion', {
    colorPrimary: '#fff;} </style><script>bad()</script>',
    borderRadius: '12; background:url(javascript:bad)',
    font: `Lato';}</style><script>bad()</script>`
  }), registry, toRgba);
  assert.equal((html.match(/<\/script>/gi) || []).length, 1);
  assert.ok(!html.includes('background:url(javascript:bad)'));
  assert.ok(!html.includes('#fff;}'));
  assert.ok(!html.includes("Lato';}"));
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(html.includes('&lt;angle&gt;'));
  assert.ok(html.includes('emoji 😀'));
  const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => Function(script));
});

test('component modules sanitize direct generateHTML calls', () => {
  const html = accordion.generateHTML({
    iconStyle: 'chevron',
    items: [{ title: hostile, content: `<strong>Allowed</strong>${hostile}` }]
  });
  assert.equal((html.match(/<script>/gi) || []).length, 0);
  assert.ok(html.includes('<strong>Allowed</strong>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('العربية हिन्दी 中文 日本語'));
});

test('unsafe link and media URLs are removed from generated markup', () => {
  const linkHtml = generateIframeContent(stateFor('button-list', {
    items: [{ title: hostile, content: 'javascript:alert(1)' }]
  }), registry, toRgba);
  assert.ok(linkHtml.includes('href="#"'));
  assert.ok(!linkHtml.includes('javascript:alert'));

  const imageHtml = generateIframeContent(stateFor('image-gallery', {
    items: [{ title: hostile, content: 'data:text/html,<script>alert(1)</script>' }]
  }), registry, toRgba);
  assert.ok(imageHtml.includes('data-img=""'));
  assert.ok(!imageHtml.includes('data:text/html'));
});

test('iframe srcdoc export cannot escape its attribute', () => {
  const html = generateIframeContent(stateFor('accordion'), registry, toRgba);
  const payload = buildExportPayload(html);
  assert.ok(payload.iframe.startsWith('<iframe srcdoc="'));
  assert.ok(payload.iframe.includes('&lt;!DOCTYPE html&gt;'));
  assert.equal((payload.iframe.match(/ srcdoc="/g) || []).length, 1);
});

test('very long, emoji, and multilingual content is retained safely', () => {
  const escaped = escapeHTML(veryLong);
  assert.ok(escaped.endsWith('END'));
  assert.ok(escaped.includes('😀'));
  assert.ok(escaped.length > veryLong.length);
  const multilingual = sanitizeRichText('<p>مرحبا नमस्ते 你好 こんにちは 🌍</p>');
  assert.equal(multilingual, '<p>مرحبا नमस्ते 你好 こんにちは 🌍</p>');
});
