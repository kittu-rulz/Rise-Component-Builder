import { createDefaultItem } from './editor-schemas.js';
import { sanitizeRichText } from './utilities.js';
import { isMediaReference } from './media.js';
import { createMediaUploadControl } from './media-upload.js';

export const supportedEditorFieldTypes = [
  'text', 'textarea', 'number', 'range', 'select', 'checkbox', 'radio',
  'color', 'url', 'image', 'audio', 'video', 'richtext'
];

export function switchEditorTab(tabId, tabs, panes) {
  tabs.forEach(tab => tab.classList.remove('active'));
  panes.forEach(pane => pane.classList.remove('active'));
  document.querySelector(`.editor-tab[data-tab="${tabId}"]`)?.classList.add('active');
  document.getElementById(`tab-${tabId}`)?.classList.add('active');
}

export function addEditorItem(state, schema) {
  state.config.items.push(createDefaultItem(schema));
}

export function validateActiveComponent(state, componentRegistry) {
  const component = componentRegistry[state.selectedComponent?.id || 'accordion'];
  return component ? component.validate(state.config) : { valid: true, errors: [] };
}

function isEmpty(value) {
  return value === undefined || value === null || (typeof value === 'string' && !value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
}

export function validateSchemaField(field, value, items = []) {
  const errors = [];
  if (field.required && isEmpty(value)) errors.push(`${field.label} is required.`);
  if (field.requiredOne && !items.some(item => Boolean(item[field.id]))) errors.push(`Select one ${field.label.toLowerCase()}.`);
  if (isEmpty(value)) return errors;

  if (field.type === 'number' || field.type === 'range') {
    const number = Number(value);
    if (!Number.isFinite(number)) errors.push(`${field.label} must be a number.`);
    if (field.min !== undefined && number < field.min) errors.push(`${field.label} must be at least ${field.min}.`);
    if (field.max !== undefined && number > field.max) errors.push(`${field.label} must be no more than ${field.max}.`);
  }
  if (field.type === 'url' && value && !isMediaReference(value)) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { errors.push(`${field.label} must be a valid URL.`); }
  }
  if (['image', 'audio', 'video'].includes(field.type) && value && !isMediaReference(value) && !String(value).startsWith('data:')) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { errors.push(`${field.label} must be a valid web URL or uploaded file.`); }
  }
  if (field.type === 'color' && value && !/^#[0-9a-f]{6}$/i.test(String(value))) errors.push(`${field.label} must be a six-digit hexadecimal color.`);
  if (field.maxLength && String(value).length > field.maxLength) errors.push(`${field.label} must be ${field.maxLength} characters or fewer.`);
  if (field.pattern && !new RegExp(field.pattern).test(String(value))) errors.push(field.patternMessage || `${field.label} has an invalid format.`);
  return errors;
}

function getAccessibilityWarning(field, value, model) {
  if (field.warningWhen && isEmpty(model[field.warningWhen])) return '';
  if (field.warningUnless && !model[field.warningUnless] && isEmpty(value)) return field.warningMessage || `${field.label} is recommended for accessibility.`;
  if (field.warningUnlessAny && !field.warningUnlessAny.some(id => !isEmpty(model[id]))) return field.warningMessage || 'Provide an accessible media alternative.';
  return '';
}

function createLabel(field, controlId) {
  const label = document.createElement('label');
  label.htmlFor = controlId;
  label.textContent = field.label;
  if (field.required || field.requiredOne) {
    const required = document.createElement('span');
    required.className = 'required-indicator';
    required.textContent = ' *';
    required.setAttribute('aria-hidden', 'true');
    label.appendChild(required);
  }
  return label;
}

function setControlValue(control, field, value) {
  if (field.type === 'checkbox' || field.type === 'radio') control.checked = Boolean(value);
  else if (field.type === 'richtext') control.innerHTML = sanitizeRichText(value ?? '');
  else control.value = value ?? '';
}

function createBasicControl(field, controlId, value) {
  let control;
  if (field.type === 'textarea') {
    control = document.createElement('textarea');
  } else if (field.type === 'richtext') {
    control = document.createElement('div');
    control.className = 'schema-richtext';
    control.contentEditable = 'true';
    control.setAttribute('role', 'textbox');
    control.setAttribute('aria-multiline', 'true');
  } else if (field.type === 'select') {
    control = document.createElement('select');
    (field.options || []).forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = typeof option === 'object' ? option.value : option;
      optionElement.textContent = typeof option === 'object' ? option.label : option;
      control.appendChild(optionElement);
    });
  } else {
    control = document.createElement('input');
    control.type = field.type === 'checkbox' || field.type === 'radio' ? field.type : field.type;
    if (field.type === 'number' || field.type === 'range') {
      if (field.min !== undefined) control.min = field.min;
      if (field.max !== undefined) control.max = field.max;
      if (field.step !== undefined) control.step = field.step;
    }
    if (field.maxLength) control.maxLength = field.maxLength;
  }
  control.id = controlId;
  control.dataset.fieldId = field.id;
  setControlValue(control, field, value);
  return control;
}

export function createSchemaItemEditor({ container, onChange }) {
  const collapsedItems = new WeakSet();
  let draggedIndex = null;

  function appendField({ field, model, items, schema, indexKey, target, onMultiple }) {
    if (!supportedEditorFieldTypes.includes(field.type)) return;
    const wrapper = document.createElement('div');
    wrapper.className = `input-wrapper schema-field schema-field-${field.type}`;
    const controlId = `schema-${indexKey}-${field.id}`;
    const error = document.createElement('div');
    error.className = 'field-error';
    error.id = `${controlId}-error`;
    error.setAttribute('role', 'alert');
    const warning = document.createElement('div');
    warning.className = 'field-warning';
    warning.id = `${controlId}-warning`;

    const updateError = control => {
      const errors = validateSchemaField(field, model[field.id], items);
      const warningText = getAccessibilityWarning(field, model[field.id], model);
      error.textContent = errors[0] || '';
      warning.textContent = warningText;
      wrapper.classList.toggle('has-error', errors.length > 0);
      wrapper.classList.toggle('has-warning', Boolean(warningText));
      control.setAttribute('aria-invalid', String(errors.length > 0));
      control.setAttribute('aria-describedby', [error.id, warningText ? warning.id : ''].filter(Boolean).join(' '));
    };
    const updateValue = (value, control) => {
      if (field.type === 'radio' && field.groupAcrossItems) items.forEach(entry => { entry[field.id] = false; });
      model[field.id] = value;
      updateError(control);
      onChange();
    };

    let control;
    let fieldElement;
    if (['image', 'audio', 'video'].includes(field.type) || field.uploadKind) {
      let media;
      media = createMediaUploadControl({
        field, controlId, value: model[field.id],
        onChange: value => {
          model[`${field.id}Duration`] = isMediaReference(value) && Number.isFinite(value.duration) ? value.duration : null;
          updateValue(value, media.validationControl);
        },
        onMultiple: references => {
          if (onMultiple) onMultiple(references);
          updateError(media.validationControl);
          onChange();
        }
      });
      fieldElement = media.element;
      control = media.validationControl;
    } else {
      control = createBasicControl(field, controlId, model[field.id]);
      fieldElement = control;
      if (field.type === 'radio') control.name = `schema-radio-${field.id}`;
      if (field.type === 'richtext') {
        const shell = document.createElement('div');
        shell.className = 'schema-richtext-shell';
        const toolbar = document.createElement('div');
        toolbar.className = 'schema-richtext-toolbar';
        [['Bold', 'bold'], ['Italic', 'italic'], ['List', 'insertUnorderedList']].forEach(([label, command]) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = label;
          button.setAttribute('aria-label', `${label} formatting`);
          button.addEventListener('mousedown', event => {
            event.preventDefault();
            control.focus();
            document.execCommand(command, false);
            updateValue(control.innerHTML, control);
          });
          toolbar.appendChild(button);
        });
        shell.append(toolbar, control);
        fieldElement = shell;
      }
      const eventName = ['select', 'checkbox', 'radio', 'color'].includes(field.type) ? 'change' : 'input';
      control.addEventListener(eventName, () => {
        const nextValue = field.type === 'checkbox' || field.type === 'radio'
          ? control.checked
          : field.type === 'richtext' ? control.innerHTML : control.value;
        updateValue(nextValue, control);
        if (field.type === 'range') rangeValue.textContent = `${control.value}${field.suffix || ''}`;
        if (field.type === 'radio' && field.groupAcrossItems) render(lastRender);
      });
    }

    const label = createLabel(field, controlId);
    wrapper.append(label, fieldElement);
    let rangeValue;
    if (field.type === 'range') {
      rangeValue = document.createElement('output');
      rangeValue.className = 'range-value';
      rangeValue.textContent = `${control.value}${field.suffix || ''}`;
      wrapper.appendChild(rangeValue);
    }
    wrapper.append(error, warning);
    target.appendChild(wrapper);
    updateError(control);
  }

  let lastRender = null;
  function render({ schema, items, config = {} }) {
    lastRender = { schema, items, config };
    container.innerHTML = '';

    if (schema.componentFields?.length) {
      const componentCard = document.createElement('section');
      componentCard.className = 'dynamic-item-card component-fields-card';
      const title = document.createElement('h3');
      title.className = 'component-fields-title';
      title.textContent = schema.componentLabel || 'Component media';
      const body = document.createElement('div');
      body.className = 'item-card-body';
      schema.componentFields.forEach(field => appendField({ field, model: config, items, schema, indexKey: 'component', target: body }));
      componentCard.append(title, body);
      container.appendChild(componentCard);
    }

    if (items.length < (schema.minItems || 0)) {
      const collectionError = document.createElement('div');
      collectionError.className = 'schema-collection-error';
      collectionError.setAttribute('role', 'alert');
      collectionError.textContent = `Add at least ${schema.minItems} ${schema.itemLabel.toLowerCase()}${schema.minItems === 1 ? '' : 's'}.`;
      container.appendChild(collectionError);
    }

    items.forEach((item, index) => {
      const card = document.createElement('section');
      card.className = 'dynamic-item-card';
      card.draggable = true;
      card.dataset.index = index;
      const collapsed = collapsedItems.has(item);
      card.classList.toggle('collapsed', collapsed);

      const header = document.createElement('div');
      header.className = 'item-card-header';
      const heading = document.createElement('button');
      heading.type = 'button';
      heading.className = 'item-collapse-btn';
      const summaryField = schema.itemFields.find(schemaField => !isEmpty(item[schemaField.id]));
      const summaryValue = summaryField ? item[summaryField.id] : '';
      const summary = summaryField ? String(isMediaReference(summaryValue) ? summaryValue.name : summaryValue).replace(/\s+/g, ' ').slice(0, 48) : '';
      heading.textContent = `${collapsed ? '▸' : '▾'} ${schema.itemLabel} ${index + 1}${summary ? ` — ${summary}` : ''}`;
      heading.setAttribute('aria-expanded', String(!collapsed));
      heading.addEventListener('click', () => {
        if (collapsed) collapsedItems.delete(item); else collapsedItems.add(item);
        render({ schema, items, config });
      });

      const actions = document.createElement('div');
      actions.className = 'item-card-actions';
      const addButton = (label, title, handler, disabled = false) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'item-action-btn';
        button.textContent = label;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.disabled = disabled;
        button.addEventListener('click', handler);
        actions.appendChild(button);
      };
      addButton('⠿', 'Drag to reorder', event => event.preventDefault());
      addButton('↑', 'Move item up', () => move(index, index - 1, schema, items, config), index === 0);
      addButton('↓', 'Move item down', () => move(index, index + 1, schema, items, config), index === items.length - 1);
      addButton('⧉', 'Duplicate item', () => {
        const duplicate = structuredClone(item);
        schema.itemFields.filter(field => field.groupAcrossItems).forEach(field => { duplicate[field.id] = false; });
        items.splice(index + 1, 0, duplicate);
        onChange();
        render({ schema, items, config });
      });
      addButton('×', 'Delete item', () => {
        items.splice(index, 1);
        onChange();
        render({ schema, items, config });
      });
      header.append(heading, actions);
      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'item-card-body';
      if (!collapsed) {
        schema.itemFields.forEach(field => {
          appendField({
            field, model: item, items, schema, indexKey: index, target: body,
            onMultiple: references => {
              item[field.id] = references[0];
              item[`${field.id}Duration`] = Number.isFinite(references[0]?.duration) ? references[0].duration : null;
              references.slice(1).forEach((reference, offset) => {
                const newItem = createDefaultItem(schema);
                newItem[field.id] = reference;
                newItem[`${field.id}Duration`] = Number.isFinite(reference.duration) ? reference.duration : null;
                if ('title' in newItem) newItem.title = reference.name.replace(/\.[^.]+$/, '');
                items.splice(index + 1 + offset, 0, newItem);
              });
              render({ schema, items, config });
            }
          });
        });
      }
      card.appendChild(body);

      card.addEventListener('dragstart', event => {
        draggedIndex = index;
        card.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragover', event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; });
      card.addEventListener('drop', event => {
        event.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) move(draggedIndex, index, schema, items, config);
      });
      card.addEventListener('dragend', () => { draggedIndex = null; card.classList.remove('dragging'); });
      container.appendChild(card);
    });
  }

  function move(from, to, schema, items, config) {
    if (to < 0 || to >= items.length || from === to) return;
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    onChange();
    render({ schema, items, config });
  }

  return { render };
}
