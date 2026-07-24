import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeHTML, sanitizeRichText } from '../js/utilities.js';

export const id = 'multiple-select';
export const name = 'Multiple Select Check';
export const category = 'knowledge';
export const defaultConfig = {
  items: [
    { label: 'Improves long-term retention', content: 'Spaced, bite-sized review strengthens recall.', correct: true },
    { label: 'Supports mobile learning', content: 'Short segments fit naturally into mobile sessions.', correct: true },
    { label: 'Requires no learner interaction', content: 'Interaction is what drives engagement and retention.', correct: false },
    { label: 'Replaces the need for assessments', content: 'Micro-learning complements, not replaces, assessment.', correct: false }
  ]
};
export const editorSchema = getEditorSchema(id);

export function generateHTML(config) {
  return `<div class="quiz-block quiz-multi"><div class="quiz-options" role="group" aria-label="Answer choices, select all that apply">${config.items.map((item, index) => `
    <div class="quiz-option" role="checkbox" tabindex="${index === 0 ? '0' : '-1'}" aria-checked="false" data-idx="${index}"><div class="option-check-square" aria-hidden="true"></div><div class="option-text">${item.label ? sanitizeRichText(item.label) : escapeHTML(item.title || 'Option Label')}</div></div>`).join('')}</div>
    <button class="quiz-submit-btn" type="button" data-quiz-mode="multi">Submit Answer</button><div id="quiz-feedback-box" class="quiz-feedback" role="status" aria-live="polite" aria-atomic="true" style="display:none;"></div>
  </div>`;
}
export function generateCSS() { return '.quiz-option{cursor:pointer}.quiz-feedback{display:none}'; }
export function generateJS() { return 'document.querySelectorAll(\'.quiz-option\').forEach(function(option){option.addEventListener(\'click\',toggleQuizOption);});'; }
export function validate(config) {
  const errors = [];
  if (!Array.isArray(config.items) || config.items.length < 2) errors.push('Add at least two answer options.');
  if (Array.isArray(config.items) && !config.items.some(item => item.correct)) errors.push('Select at least one correct answer.');
  return { valid: errors.length === 0, errors };
}
