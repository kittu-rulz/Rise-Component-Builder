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

export function generateCSS() {
  return `
    .vertical-timeline-container {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-left: 32px;
    }

    .vertical-timeline-container::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background-color: var(--accent);
      opacity: 0.2;
    }

    .timeline-step {
      position: relative;
      margin-bottom: 24px;
      cursor: pointer;
    }

    .step-marker {
      position: absolute;
      left: -32px;
      top: 4px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background-color: var(--accent-light);
      border: 2px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .step-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
    }

    .step-card {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 16px 20px;
    }

    .step-card h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .step-card p {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .timeline-step.active .step-marker {
      background-color: var(--accent);
    }
    .timeline-step.active .step-num {
      color: var(--on-accent);
    }
    .timeline-step.active .step-card {
      border-color: var(--accent);
    }`;
}

export function generateJS() {
  return `
    function initComponent() {
      document.querySelectorAll('.timeline-step').forEach(function(step, idx) {
        step.setAttribute('tabindex', '0');
        step.addEventListener('click', function() {
          document.querySelectorAll('.timeline-step').forEach(function(item) {
            item.classList.remove('active');
          });
          step.classList.add('active');
          document.querySelectorAll('.timeline-step').forEach(function(item) { item.setAttribute('aria-pressed', String(item === step)); });
          viewedItems.add(idx);
          updateProgress();
        });
        step.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            step.click();
          }
        });
      });
    }`;
}

export function validate(config) {
  const errors = Array.isArray(config.items) && config.items.length ? [] : ['Add at least one timeline step.'];
  return { valid: errors.length === 0, errors };
}
