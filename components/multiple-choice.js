import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeHTML, sanitizeRichText } from '../js/utilities.js';

export const id = 'multiple-choice';
export const name = 'Multiple Choice Check';
export const category = 'knowledge';
export const defaultConfig = {
  items: [
    { label: 'Option A (Correct)', content: 'Micro-learning helps memory retention.', correct: true },
    { label: 'Option B', content: 'Courses must be at least 1 hour long.', correct: false },
    { label: 'Option C', content: 'Instructional text should be very dense.', correct: false }
  ]
};
export const editorSchema = getEditorSchema(id);

export function generateHTML(config) {
  return `<div class="quiz-block"><div class="quiz-options" role="radiogroup" aria-label="Answer choices">${config.items.map((item, index) => `
    <div class="quiz-option" role="radio" tabindex="${index === 0 ? '0' : '-1'}" aria-checked="false" data-idx="${index}"><div class="option-check-circle" aria-hidden="true"></div><div class="option-text">${item.label ? sanitizeRichText(item.label) : escapeHTML(item.title || 'Option Label')}</div></div>`).join('')}</div>
    <button class="quiz-submit-btn" type="button">Submit Answer</button><div id="quiz-feedback-box" class="quiz-feedback" role="status" aria-live="polite" aria-atomic="true" style="display:none;"></div>
  </div>`;
}
export function generateCSS() { return '.quiz-option{cursor:pointer}.quiz-feedback{display:none}'; }
export function generateJS() { return 'document.querySelectorAll(\'.quiz-option\').forEach(function(option){option.addEventListener(\'click\',selectQuizOption);});'; }
export function validate(config) {
  const errors = [];
  if (!Array.isArray(config.items) || config.items.length < 2) errors.push('Add at least two answer options.');
  if (Array.isArray(config.items) && !config.items.some(item => item.correct)) errors.push('Select a correct answer.');
  return { valid: errors.length === 0, errors };
}
