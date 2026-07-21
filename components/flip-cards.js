import { getEditorSchema } from '../js/editor-schemas.js';
import { escapeAttribute, escapeHTML, sanitizeRichText } from '../js/utilities.js';

export const id = 'flip-cards';
export const name = '3D Flip Cards';
export const category = 'interactive';
export const defaultConfig = {
  items: [
    { title: 'Front Side A', content: 'Hover to reveal definition.' },
    { title: 'Back Side A', content: 'Definitions should be concise.' },
    { title: 'Front Side B', content: 'Mobile compatibility check.' },
    { title: 'Back Side B', content: 'Rise blocks fit full width.' }
  ]
};
export const editorSchema = getEditorSchema(id);

export function generateHTML(config) {
  const cards = [];
  for (let index = 0; index < config.items.length; index += 2) {
    if (config.items[index]) cards.push({ front: config.items[index], back: config.items[index + 1] || { title: 'Back Side Label', content: 'Back side description text.' } });
  }
  return `<div class="flip-cards-grid">${cards.map((card, index) => `
    <div class="flip-card" role="button" tabindex="0" aria-expanded="false" aria-controls="flip-card-back-${index}" aria-label="${escapeAttribute(card.front.title || 'Flip card')}: reveal back">
      <div class="flip-card-inner">
      <div class="flip-card-front" id="flip-card-front-${index}" aria-hidden="false"><div class="card-icon-badge" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div><h3>${escapeHTML(card.front.title || 'Front Title')}</h3><p>${sanitizeRichText(card.front.content || 'Click to reveal definition.')}</p></div>
      <div class="flip-card-back" id="flip-card-back-${index}" aria-hidden="true"><h3>${escapeHTML(card.back.title || 'Back Title')}</h3><p>${sanitizeRichText(card.back.content || 'Back description content goes here.')}</p></div>
    </div></div>`).join('')}</div>`;
}
export function generateCSS() { return '.flip-card{perspective:1000px}.flip-card-inner{transform-style:preserve-3d}.flip-card.flipped .flip-card-inner{transform:rotateY(180deg)}'; }
export function generateJS() { return 'document.querySelectorAll(\'.flip-card\').forEach(function(card){card.addEventListener(\'click\',function(){card.classList.toggle(\'flipped\');});});'; }
export function validate(config) {
  const errors = Array.isArray(config.items) && config.items.length ? [] : ['Add at least one card face.'];
  return { valid: errors.length === 0, errors };
}
