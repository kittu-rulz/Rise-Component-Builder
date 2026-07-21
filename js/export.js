import { escapeSrcdoc, generateHtmlFragment, registerLocalBlobURL, revokeLocalBlobURL, slugify } from './utilities.js';
import { blobToDataURL, isMediaReference, sanitizeAssetFilename, SMALL_IMAGE_INLINE_LIMIT } from './media.js';
import { getMediaRecord, mediaStore } from './media-storage.js';

export function buildExportPayload(fullHtml, options = {}) {
  return {
    iframe: `<iframe srcdoc="${escapeSrcdoc(fullHtml)}" width="100%" height="500px" style="border:none;" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"></iframe>`,
    fragment: generateHtmlFragment(fullHtml),
    manifest: Array.isArray(options.manifest) ? options.manifest : [],
    warnings: Array.isArray(options.warnings) ? options.warnings : []
  };
}

export async function prepareMediaExport(config, options = {}) {
  const store = options.store || mediaStore;
  const inlineImageLimit = options.inlineImageLimit ?? SMALL_IMAGE_INLINE_LIMIT;
  const manifest = [];
  const assets = [];
  const warnings = [];
  const filenames = new Set();
  const resolvedMedia = new Map();

  const uniqueFilename = name => {
    const safe = sanitizeAssetFilename(name, 'asset');
    if (!filenames.has(safe)) { filenames.add(safe); return safe; }
    const dot = safe.lastIndexOf('.');
    const stem = dot > 0 ? safe.slice(0, dot) : safe;
    const extension = dot > 0 ? safe.slice(dot) : '';
    let counter = 2;
    while (filenames.has(`${stem}-${counter}${extension}`)) counter += 1;
    const unique = `${stem}-${counter}${extension}`;
    filenames.add(unique);
    return unique;
  };

  const transform = async value => {
    if (isMediaReference(value)) {
      if (resolvedMedia.has(value.mediaId)) return resolvedMedia.get(value.mediaId);
      const record = await getMediaRecord(value.mediaId, store);
      if (!record?.blob) {
        warnings.push(`Uploaded media “${value.name}” is missing from local storage and cannot be exported.`);
        return '';
      }
      const filename = uniqueFilename(record.name);
      const relativePath = `assets/${filename}`;
      const manifestEntry = { filename, sourceMediaId: record.id, mimeType: record.mimeType, relativePath };
      manifest.push(manifestEntry);
      assets.push({ ...manifestEntry, blob: record.blob });
      const canInline = record.kind === 'image' && record.mimeType !== 'image/svg+xml' && record.size <= inlineImageLimit;
      if (canInline) {
        const dataUrl = await blobToDataURL(record.blob);
        resolvedMedia.set(value.mediaId, dataUrl);
        return dataUrl;
      }
      warnings.push(`“${record.name}” requires an external asset file at ${relativePath}; it cannot be safely included in a single HTML file.`);
      resolvedMedia.set(value.mediaId, relativePath);
      return relativePath;
    }
    if (Array.isArray(value)) return Promise.all(value.map(transform));
    if (value && typeof value === 'object') {
      const entries = await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await transform(entry)]));
      return Object.fromEntries(entries);
    }
    return value;
  };

  return { config: await transform(config), manifest, assets, warnings };
}

export function downloadHtml(title, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = registerLocalBlobURL(URL.createObjectURL(blob));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(title || 'rise-component')}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  revokeLocalBlobURL(url);
}

export function downloadProjectJson(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = registerLocalBlobURL(URL.createObjectURL(blob));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(project.name || 'rise-project')}.rise.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  revokeLocalBlobURL(url);
}

export function downloadAssetManifest(title, manifest) {
  const blob = new Blob([JSON.stringify({ schemaVersion: 1, assets: manifest }, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = registerLocalBlobURL(URL.createObjectURL(blob));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(title || 'rise-component')}.assets.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  revokeLocalBlobURL(url);
}
