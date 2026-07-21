import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeHTML, sanitizeRichText } from '../js/utilities.js';

export const id = 'tab-blocks';
export const name = 'Horizontal Tabs';
export const category = 'interactive';
export const defaultConfig = {
  items: [
    { title: 'Tab 1: Overview', content: 'A high-level explanation of the subject matter, laying a strong conceptual foundation.' },
    { title: 'Tab 2: Details', content: 'In-depth description of procedures, parameters, and design metrics.' },
    { title: 'Tab 3: Summary', content: 'Key takeaways and visual summaries to reinforce memory retention.' }
  ]
};
export const editorSchema = getEditorSchema(id);

export function generateHTML(config) {
  return `<div class="tabs-container">
    <div class="tabs-header" role="tablist" aria-label="Content sections">${config.items.map((item, index) => `<button class="tab-btn ${index === 0 ? 'active' : ''}" id="tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="tab-panel-${index}" tabindex="${index === 0 ? '0' : '-1'}">${escapeHTML(item.title || 'Tab')}</button>`).join('')}</div>
    <div class="tabs-content-wrapper">${config.items.map((item, index) => `<div class="tab-panel ${index === 0 ? 'active' : ''}" id="tab-panel-${index}" role="tabpanel" aria-labelledby="tab-${index}" tabindex="0" ${index === 0 ? '' : 'hidden'}><p>${sanitizeRichText(item.content || '')}</p></div>`).join('')}</div>
  </div>`;
}
export function generateCSS() { return '.tab-panel{display:none}.tab-panel.active{display:block}'; }
export function generateJS() { return 'document.querySelectorAll(\'.tab-btn\').forEach(function(button){button.addEventListener(\'click\',switchTab);});'; }
export function validate(config) {
  const errors = Array.isArray(config.items) && config.items.length ? [] : ['Add at least one tab.'];
  return { valid: errors.length === 0, errors };
}
