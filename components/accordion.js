import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeHTML, sanitizeRichText } from '../js/utilities.js';

export const id = 'accordion';
export const name = 'Responsive Accordion';
export const category = 'interactive';
export const defaultConfig = {
  accordionMulti: true,
  accordionAnimation: true,
  iconStyle: 'chevron',
  items: [
    { title: 'Understanding User Intent', content: 'Instructional design begins by identifying the core learning objectives and alignment with business outcomes.' },
    { title: 'Designing for Engagement', content: 'Modern eLearning relies on micro-interactions, clean visual layouts, and bite-sized chunks of information.' },
    { title: 'SCORM and Tracking Analytics', content: 'Export clean standard elements to trace course completion, custom interaction states, and score cards.' }
  ]
};
export const editorSchema = getEditorSchema(id);

export function generateHTML(config) {
  const icon = config.iconStyle === 'chevron'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="acc-arrow"><polyline points="6 9 12 15 18 9"></polyline></svg>'
    : config.iconStyle === 'plus-minus'
      ? '<div class="acc-plus-minus"></div>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="acc-arrow"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  return `<div class="accordion-group">${config.items.map((item, index) => `
    <div class="accordion-item" id="item-${index}">
      <h3><button class="accordion-trigger" id="accordion-trigger-${index}" data-idx="${index}" aria-expanded="false" aria-controls="accordion-panel-${index}"><span>${escapeHTML(item.title || 'Item Title Header')}</span>${icon}</button></h3>
      <div class="accordion-content" id="accordion-panel-${index}" role="region" aria-labelledby="accordion-trigger-${index}" aria-hidden="true"><div class="accordion-body"><p>${sanitizeRichText(item.content || 'Customize accordion body descriptions.')}</p></div></div>
    </div>`).join('')}</div>`;
}

export function generateCSS() {
  return '.accordion-content{overflow:hidden}.accordion-trigger{width:100%}';
}

export function generateJS(config) {
  return `var multiOpen=${Boolean(config.accordionMulti)};var allowAnimation=${Boolean(config.accordionAnimation)};`;
}

export function validate(config) {
  const errors = [];
  if (!Array.isArray(config.items) || !config.items.length) errors.push('Add at least one accordion item.');
  return { valid: errors.length === 0, errors };
}
