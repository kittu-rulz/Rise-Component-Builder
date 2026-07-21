import { describe, expect, test } from 'vitest';
import { JSDOM } from 'jsdom';
import * as accordion from '../../components/accordion.js';
import * as tabs from '../../components/tabs.js';
import * as flipCards from '../../components/flip-cards.js';
import * as verticalTimeline from '../../components/vertical-timeline.js';
import * as multipleChoice from '../../components/multiple-choice.js';
import { invalidUrls, longText, multilingualText, rtlText, unsafeText } from '../fixtures/index.js';

const generators = [accordion, tabs, flipCards, verticalTimeline, multipleChoice];

function itemsFor(component, count, content = 'Description') {
  return Array.from({ length: count }, (_, index) => component.id === 'multiple-choice'
    ? { label: `Option ${index + 1}`, content, correct: index === 0 }
    : { title: `Item ${index + 1}`, content });
}

function assertSafeOutput(component, config) {
  const html = component.generateHTML(config);
  const css = component.generateCSS(config);
  const js = component.generateJS(config);
  expect(typeof html).toBe('string');
  expect(typeof css).toBe('string');
  expect(typeof js).toBe('string');
  expect(html).not.toMatch(/undefined|\[object Object\]/);
  expect(css).not.toMatch(/undefined|\[object Object\]/);
  expect(js).not.toMatch(/undefined|\[object Object\]/);
  expect(() => new Function(js)).not.toThrow();
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const ids = [...dom.window.document.querySelectorAll('[id]')].map(element => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  const style = dom.window.document.createElement('style');
  style.textContent = css;
  dom.window.document.head.append(style);
  expect(style.sheet).not.toBeNull();
  return html;
}

describe.each(generators)('$name generator', component => {
  test('exports the complete generator contract', () => {
    expect(component).toMatchObject({
      id: expect.any(String), name: expect.any(String), category: expect.any(String),
      defaultConfig: expect.any(Object), editorSchema: expect.any(Object),
      generateHTML: expect.any(Function), generateCSS: expect.any(Function), generateJS: expect.any(Function), validate: expect.any(Function)
    });
  });

  test.each([1, 12])('handles %i item(s)', count => {
    expect(() => assertSafeOutput(component, { ...component.defaultConfig, items: itemsFor(component, count) })).not.toThrow();
  });

  test('empty item lists do not crash and validation reports the authoring problem', () => {
    expect(() => assertSafeOutput(component, { ...component.defaultConfig, items: [] })).not.toThrow();
    expect(component.validate({ ...component.defaultConfig, items: [] }).valid).toBe(false);
  });

  test.each([
    ['very long text', longText], ['emoji and multilingual text', multilingualText], ['right-to-left text', rtlText],
    ['quotes and apostrophes', `She said "hello" and it's safe.`], ['closing scripts and unsafe markup', unsafeText]
  ])('handles %s safely', (_label, content) => {
    const html = assertSafeOutput(component, { ...component.defaultConfig, items: itemsFor(component, component.id === 'multiple-choice' ? 2 : 1, content) });
    expect(html.toLowerCase()).not.toContain('<script>');
    const document = new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
    expect(document.querySelector('script, [onerror]')).toBeNull();
  });

  test.each(invalidUrls)('rejects unsafe URL-like authored content: %s', url => {
    const html = assertSafeOutput(component, { ...component.defaultConfig, items: itemsFor(component, component.id === 'multiple-choice' ? 2 : 1, `<a href="${url}">link</a>`) });
    expect(html.toLowerCase()).not.toContain(url.toLowerCase());
  });
});
