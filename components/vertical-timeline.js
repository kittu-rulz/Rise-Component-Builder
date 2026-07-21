import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeAttribute, escapeHTML, sanitizeRichText } from '../js/utilities.js';

export const id = 'vertical-timeline';
export const name = 'Vertical Step Timeline';
export const category = 'timelines';
export const defaultConfig = {
  items: [
    { title: 'Phase 1: Research', content: 'Collect data assets, requirements, and verify targets.' },
    { title: 'Phase 2: Build Layout', content: 'Configure colors, fonts, margins, and borders in the tool.' },
    { title: 'Phase 3: Export HTML', content: 'Copy custom block and import inside Articulate Rise blocks.' }
  ]
};
export const editorSchema = getEditorSchema(id);

export function generateHTML(config) {
  return `<div class="vertical-timeline-container" role="list" aria-label="Timeline">${config.items.map((item, index) => `
    <div class="timeline-step" role="listitem" tabindex="0" aria-label="Step ${index + 1}: ${escapeAttribute(item.title || 'Step Title')}" aria-pressed="false"><div class="step-marker" aria-hidden="true"><span class="step-num">${index + 1}</span></div><div class="step-card"><h4>${escapeHTML(item.title || 'Step Title')}</h4><p>${sanitizeRichText(item.content || 'Step content description details go here.')}</p></div></div>`).join('')}</div>`;
}
export function generateCSS() { return '.vertical-timeline-container{position:relative}.timeline-step{position:relative}'; }
export function generateJS() { return 'document.querySelectorAll(\'.timeline-step\').forEach(function(step){step.addEventListener(\'click\',function(){step.classList.toggle(\'active\');});});'; }
export function validate(config) {
  const errors = Array.isArray(config.items) && config.items.length ? [] : ['Add at least one timeline step.'];
  return { valid: errors.length === 0, errors };
}
