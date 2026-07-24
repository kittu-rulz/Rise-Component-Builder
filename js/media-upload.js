import { formatFileSize, isMediaReference, MEDIA_LIMITS, prepareMediaFile } from './media.js';
import { ensureMediaObjectURL, peekMediaObjectURL, saveMediaRecord } from './media-storage.js';

const ACCEPT = Object.freeze({
  image: '.jpg,.jpeg,.png,.webp,.svg,.gif,image/jpeg,image/png,image/webp,image/svg+xml,image/gif',
  audio: '.mp3,.wav,audio/mpeg,audio/wav,audio/x-wav',
  video: '.mp4,.webm,video/mp4,video/webm',
  captions: '.vtt,text/vtt'
});

async function readDuration(file, kind) {
  if (!['audio', 'video'].includes(kind) || typeof document === 'undefined') return null;
  return new Promise(resolve => {
    const element = document.createElement(kind);
    const url = URL.createObjectURL(file);
    const finish = value => {
      URL.revokeObjectURL(url);
      element.removeAttribute('src');
      resolve(Number.isFinite(value) ? value : null);
    };
    element.preload = 'metadata';
    element.addEventListener('loadedmetadata', () => finish(element.duration), { once: true });
    element.addEventListener('error', () => finish(null), { once: true });
    element.src = url;
  });
}

function createPreview(kind, source, name) {
  if (!source || kind === 'captions') return null;
  const element = document.createElement(kind === 'image' ? 'img' : kind);
  element.className = 'media-upload-preview';
  element.src = source;
  if (kind === 'image') element.alt = `Preview of ${name || 'selected image'}`;
  else element.controls = true;
  if (kind === 'video') element.muted = true;
  return element;
}

export function createMediaUploadControl({
  field, controlId, value, onChange, onMultiple, store, limits
}) {
  let currentValue = value || '';
  const kind = field.uploadKind || field.type;
  const root = document.createElement('div');
  root.className = 'media-upload-control';

  const urlRow = document.createElement('div');
  urlRow.className = 'media-url-row';
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.id = controlId;
  urlInput.dataset.fieldId = field.id;
  urlInput.placeholder = `Enter external ${kind === 'captions' ? 'captions' : field.type} URL`;
  urlInput.value = typeof currentValue === 'string' ? currentValue : '';
  const externalButton = document.createElement('button');
  externalButton.type = 'button';
  externalButton.className = 'btn btn-text btn-small media-external-btn';
  externalButton.textContent = 'Reset to external URL';
  urlRow.append(urlInput, externalButton);

  const guidance = document.createElement('p');
  guidance.className = 'media-upload-guidance';
  guidance.id = `${controlId}-guidance`;
  if (kind === 'image') {
    const preferred = field.preferredDimensions || '1200 × 900 px or larger';
    const imageLimit = formatFileSize((limits || MEDIA_LIMITS).image);
    const svgLimit = formatFileSize((limits || MEDIA_LIMITS).svg);
    guidance.textContent = `Supported formats: JPG, JPEG, PNG, WebP, SVG, GIF. Preferred dimensions: ${preferred}. Maximum file size: ${imageLimit}; SVG: ${svgLimit}.`;
    urlInput.dataset.guidanceId = guidance.id;
  } else {
    guidance.hidden = true;
  }

  const dropZone = document.createElement('div');
  dropZone.className = 'media-drop-zone';
  dropZone.tabIndex = 0;
  dropZone.setAttribute('role', 'button');
  dropZone.setAttribute('aria-label', `Upload ${field.label}. Browse or drop a file.`);
  const dropText = document.createElement('span');
  dropText.textContent = 'Drop file here or';
  const browseButton = document.createElement('button');
  browseButton.type = 'button';
  browseButton.className = 'btn btn-secondary btn-small';
  browseButton.textContent = isMediaReference(currentValue) ? 'Replace file' : 'Browse';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = ACCEPT[kind] || '';
  fileInput.multiple = Boolean(field.multiple);
  fileInput.hidden = true;
  dropZone.append(dropText, browseButton, fileInput);

  const details = document.createElement('div');
  details.className = 'media-upload-details';
  const preview = document.createElement('div');
  preview.className = 'media-preview-shell';
  const metadata = document.createElement('div');
  metadata.className = 'media-file-metadata';
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'btn btn-text btn-small media-remove-btn';
  removeButton.textContent = 'Remove file';
  details.append(preview, metadata, removeButton);

  const error = document.createElement('div');
  error.className = 'field-error media-upload-error';
  error.setAttribute('role', 'alert');
  const status = document.createElement('div');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function showError(message = '') {
    error.textContent = message;
    root.classList.toggle('has-error', Boolean(message));
  }

  function renderValue() {
    preview.replaceChildren();
    metadata.replaceChildren();
    const reference = isMediaReference(currentValue) ? currentValue : null;
    const source = reference ? peekMediaObjectURL(reference.mediaId) : typeof currentValue === 'string' ? currentValue : '';
    const previewElement = createPreview(kind, source, reference?.name);
    if (previewElement) preview.appendChild(previewElement);
    if (reference) {
      const name = document.createElement('strong');
      name.textContent = reference.name;
      const meta = document.createElement('span');
      meta.textContent = `${formatFileSize(reference.size)} • ${reference.mimeType}${Number.isFinite(reference.duration) ? ` • ${Math.round(reference.duration)} seconds` : ''}`;
      metadata.append(name, meta);
    }
    const hasUpload = Boolean(reference);
    details.hidden = !hasUpload;
    externalButton.hidden = !hasUpload;
    urlInput.disabled = hasUpload;
    browseButton.textContent = hasUpload ? 'Replace file' : 'Browse';
  }

  async function processFiles(files) {
    const selected = [...files];
    if (!selected.length) return;
    showError();
    root.classList.add('is-processing');
    dropZone.setAttribute('aria-busy', 'true');
    try {
      const references = [];
      for (const file of selected) {
        const duration = await readDuration(file, kind);
        const record = await prepareMediaFile(file, kind, { duration, limits });
        const reference = await saveMediaRecord(record, store);
        await ensureMediaObjectURL(reference.mediaId, store);
        references.push(reference);
      }
      currentValue = references[0];
      urlInput.value = '';
      renderValue();
      if (references.length > 1 && onMultiple) onMultiple(references);
      else onChange(currentValue);
      status.textContent = `${references.length} file${references.length === 1 ? '' : 's'} uploaded.`;
    } catch (uploadError) {
      showError(uploadError.message || 'The file could not be uploaded.');
    } finally {
      root.classList.remove('is-processing');
      dropZone.removeAttribute('aria-busy');
      fileInput.value = '';
    }
  }

  urlInput.addEventListener('input', () => {
    currentValue = urlInput.value;
    showError();
    onChange(currentValue);
  });
  browseButton.addEventListener('click', event => { event.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener('click', event => { if (event.target === dropZone || event.target === dropText) fileInput.click(); });
  dropZone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener('change', () => processFiles(fileInput.files || []));
  ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
  }));
  ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
  }));
  dropZone.addEventListener('drop', event => processFiles(event.dataTransfer?.files || []));
  removeButton.addEventListener('click', () => {
    currentValue = '';
    urlInput.value = '';
    renderValue();
    onChange('');
    status.textContent = 'Uploaded file removed from this component.';
  });
  externalButton.addEventListener('click', () => {
    currentValue = '';
    urlInput.value = '';
    renderValue();
    onChange('');
    urlInput.focus();
    status.textContent = 'External URL mode enabled.';
  });

  root.append(urlRow, guidance, dropZone, details, error, status);
  renderValue();
  return { element: root, validationControl: urlInput, processFiles, getValue: () => currentValue };
}
