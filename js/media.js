export const MEDIA_SCHEMA_VERSION = 1;

export const MEDIA_LIMITS = Object.freeze({
  image: 10 * 1024 * 1024,
  audio: 30 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  svg: 2 * 1024 * 1024,
  captions: 2 * 1024 * 1024
});

export const SMALL_IMAGE_INLINE_LIMIT = 1024 * 1024;

const TYPE_RULES = Object.freeze({
  image: {
    jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'], webp: ['image/webp'],
    svg: ['image/svg+xml'], gif: ['image/gif']
  },
  audio: { mp3: ['audio/mpeg', 'audio/mp3'], wav: ['audio/wav', 'audio/x-wav', 'audio/wave'] },
  video: { mp4: ['video/mp4'], webm: ['video/webm'] },
  captions: { vtt: ['text/vtt'] }
});

const MEDIA_REFERENCE_KEYS = new Set([
  'mediaId', 'schemaVersion', 'source', 'kind', 'name', 'mimeType', 'size', 'createdAt', 'duration'
]);

function createId() {
  return globalThis.crypto?.randomUUID?.() || `media-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getFileExtension(name) {
  const match = /\.([a-z0-9]+)$/i.exec(String(name || '').trim());
  return match ? match[1].toLowerCase() : '';
}

export function formatFileSize(size) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function validateMediaFile(file, kind, limits = MEDIA_LIMITS) {
  const errors = [];
  const rules = TYPE_RULES[kind];
  if (!file || typeof file.name !== 'string' || typeof file.size !== 'number') {
    return { valid: false, errors: ['Choose a valid file.'] };
  }
  if (!rules) return { valid: false, errors: ['This upload field has an unsupported media type.'] };

  const extension = getFileExtension(file.name);
  const allowedMimes = rules[extension];
  const mimeType = String(file.type || '').toLowerCase();
  if (!allowedMimes) errors.push(`.${extension || 'unknown'} files are not supported for ${kind} uploads.`);
  else if (!allowedMimes.includes(mimeType)) errors.push(`The file extension and MIME type (${mimeType || 'missing'}) do not match.`);

  const limit = extension === 'svg' ? limits.svg : limits[kind];
  if (Number.isFinite(limit) && file.size > limit) {
    errors.push(`${file.name} exceeds the ${formatFileSize(limit)} ${extension === 'svg' ? 'SVG' : kind} limit.`);
  }
  if (file.size === 0) errors.push('Empty files cannot be uploaded.');
  return { valid: errors.length === 0, errors, extension, mimeType, limit };
}

export function sanitizeSVGText(value) {
  const svg = String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  const normalized = svg
    .replace(/&#x([0-9a-f]+);?/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);?/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&colon;/gi, ':');
  const unsafeChecks = [
    { pattern: /<!DOCTYPE|<!ENTITY/i, message: 'SVG document types and entities are not allowed.' },
    { pattern: /<\s*(?:script|foreignObject|iframe|object|embed|audio|video|canvas)\b/i, message: 'SVG contains an unsafe embedded element.' },
    { pattern: /\son[a-z0-9_-]+\s*=/i, message: 'SVG event-handler attributes are not allowed.' },
    { pattern: /(?:javascript|vbscript)\s*:/i, message: 'SVG contains an unsafe script URL.' },
    { pattern: /data\s*:\s*text\/html/i, message: 'SVG contains embedded HTML.' },
    { pattern: /\b(?:href|xlink:href|src)\s*=\s*["']\s*(?!#)[^"']+/i, message: 'SVG external references are not allowed.' },
    { pattern: /@import\b|url\(\s*["']?\s*(?!#)/i, message: 'SVG external style references are not allowed.' }
  ];
  for (const check of unsafeChecks) {
    if (check.pattern.test(normalized)) return { valid: false, error: check.message, sanitized: '' };
  }
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b[\s\S]*<\/svg>\s*$/i.test(svg)) {
    return { valid: false, error: 'The file is not a complete SVG document.', sanitized: '' };
  }
  return { valid: true, sanitized: svg };
}

async function hasExpectedFileSignature(file, extension) {
  if (extension === 'svg') return true;
  if (extension === 'vtt') return /^\uFEFF?WEBVTT(?:[ \t]|\r?\n)/.test(await file.text());
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  if (['jpg', 'jpeg'].includes(extension)) return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === 'png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (extension === 'gif') return ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a');
  if (extension === 'webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
  if (extension === 'wav') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE';
  if (extension === 'mp3') return ascii.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (extension === 'mp4') return ascii.slice(4, 8) === 'ftyp';
  if (extension === 'webm') return [0x1a, 0x45, 0xdf, 0xa3].every((value, index) => bytes[index] === value);
  return false;
}

export async function prepareMediaFile(file, kind, options = {}) {
  const validation = validateMediaFile(file, kind, options.limits || MEDIA_LIMITS);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  if (!await hasExpectedFileSignature(file, validation.extension)) {
    throw new Error(`The contents of ${file.name} do not match its declared file type.`);
  }

  let blob = file;
  if (validation.extension === 'svg') {
    const result = sanitizeSVGText(await file.text());
    if (!result.valid) throw new Error(result.error);
    blob = new Blob([result.sanitized], { type: 'image/svg+xml' });
  }

  const now = new Date().toISOString();
  return {
    id: options.id || createId(),
    schemaVersion: MEDIA_SCHEMA_VERSION,
    name: file.name,
    mimeType: validation.mimeType,
    size: blob.size,
    createdAt: now,
    kind,
    duration: Number.isFinite(options.duration) ? options.duration : null,
    altText: '',
    decorative: false,
    caption: '',
    transcript: '',
    blob
  };
}

export function createMediaReference(record) {
  return {
    source: 'upload',
    mediaId: record.id,
    schemaVersion: MEDIA_SCHEMA_VERSION,
    kind: record.kind,
    name: record.name,
    mimeType: record.mimeType,
    size: record.size,
    createdAt: record.createdAt,
    duration: Number.isFinite(record.duration) ? record.duration : null
  };
}

export function isMediaReference(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && value.source === 'upload' && typeof value.mediaId === 'string' && Boolean(value.mediaId)
    && value.schemaVersion === MEDIA_SCHEMA_VERSION
    && ['image', 'audio', 'video', 'captions'].includes(value.kind)
    && typeof value.name === 'string' && Boolean(value.name.trim())
    && typeof value.mimeType === 'string' && Boolean(value.mimeType)
    && Number.isFinite(value.size) && value.size >= 0
    && typeof value.createdAt === 'string' && !Number.isNaN(Date.parse(value.createdAt))
    && [...MEDIA_REFERENCE_KEYS].every(key => value[key] === undefined || value[key] === null
      || ['string', 'number'].includes(typeof value[key]));
}

export function collectMediaReferences(value, found = new Map()) {
  if (isMediaReference(value)) {
    found.set(value.mediaId, value);
    return [...found.values()];
  }
  if (Array.isArray(value)) value.forEach(entry => collectMediaReferences(entry, found));
  else if (value && typeof value === 'object') Object.values(value).forEach(entry => collectMediaReferences(entry, found));
  return [...found.values()];
}

export function sanitizeAssetFilename(name, fallback = 'asset') {
  const source = String(name || fallback).trim();
  const extension = getFileExtension(source);
  const stem = (extension ? source.slice(0, -(extension.length + 1)) : source)
    .normalize('NFKD').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || fallback;
  return extension ? `${stem}.${extension}` : stem;
}

export async function blobToDataURL(blob) {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result)));
      reader.addEventListener('error', () => reject(reader.error || new Error('Could not read media data.')));
      reader.readAsDataURL(blob);
    });
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

export function validateMediaAccessibility(config, componentId) {
  const warnings = [];
  const items = Array.isArray(config?.items) ? config.items : [];
  const imageWarning = (item, label, sourceKey = 'content') => {
    if (!item?.[sourceKey]) return;
    if (!item.decorative && !String(item.altText || '').trim()) warnings.push(`${label} needs alternative text or must be marked decorative.`);
  };

  if (componentId === 'hotspots' && config.backgroundImage && !config.backgroundDecorative && !String(config.backgroundAltText || '').trim()) {
    warnings.push('The hotspot background needs alternative text or must be marked decorative.');
  }
  if (componentId === 'profile-cards') items.forEach((item, index) => imageWarning(item, `Profile image ${index + 1}`, 'image'));
  if (componentId === 'image-gallery') items.forEach((item, index) => imageWarning(item, `Gallery image ${index + 1}`));
  if (componentId === 'audio-player' && items.some(item => item.content && !String(item.transcript || '').replace(/<[^>]*>/g, '').trim())) {
    warnings.push('Instructional audio should include a transcript.');
  }
  if (componentId === 'video-frame' && items.some(item => item.content
    && !item.captionsUrl && !String(item.transcript || '').replace(/<[^>]*>/g, '').trim())) {
    warnings.push('Video should include captions or a transcript.');
  }
  return warnings;
}
