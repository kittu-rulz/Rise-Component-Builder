# Export contract

This document specifies the guarantee that keeps the live preview and every exported output in sync, and exactly what each export format contains. It is the detailed companion to `docs/ARCHITECTURE.md` §4/§5.

## The single-compiler guarantee

**Preview and export must never drift apart, because they are not two implementations — they are one function called from two places.**

```
                          ┌─────────────────────────────────┐
                          │  js/preview.js                   │
 appState, componentRegistry, colorToRgba                    │
        ────────────────▶│  generateIframeContent(...)      │
                          │  → one complete HTML document    │
                          │    string (CSP + <style> +       │
                          │    <script>)                     │
                          └───────────────┬───────────────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     ▼                     ▼                     ▼
          iframe.srcdoc = html   previewWindow.document   js/export.js consumes
          (writePreview, live      .write(html)             the same string
           preview panel)          (openPreview, popout)     (buildExportPayload,
                                                               prepareMediaExport)
```

`app.js` calls `generateIframeContent(appState, componentRegistry, colorToRgba)` exactly once per regeneration and reuses the resulting string for every consumer: the live preview iframe, the "pop out" preview window, the iframe embed snippet, the HTML fragment, and the standalone HTML download. There is no second code path anywhere in the codebase that re-derives a component's markup from `appState` for export purposes.

**Enforcement rule:** any change to component output must be made inside `generateIframeContent()` (or, for the six registered components, inside that component's `generateHTML`/`generateCSS`/`generateJS`, which `generateIframeContent()` calls). A change that only affects "what gets exported" and not "what the preview shows," or vice versa, is a bug by definition — the two cannot differ, because they are the same string. If a reviewer ever sees a diff that touches export-specific markup without touching preview, that is a signal the single-compiler rule is about to be violated and should be rejected.

What _is_ allowed to differ between preview and export is **transformation of the compiled string's media references**, applied uniformly after compilation (see "Media resolution" below) — this changes _which URL a reference resolves to_, never the markup structure itself.

## What each export format contains

| Format                   | Source function                                                                | Content                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Iframe embed snippet     | `buildExportPayload()` (`js/export.js`)                                        | `<iframe srcdoc="...">` wrapping the escaped, compiled HTML string, with `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"` |
| HTML fragment            | `generateHtmlFragment()` (`js/utilities.js`), called by `buildExportPayload()` | The `<style>` block and body markup extracted from the same compiled string, for pasting into a host page that already provides `<html>`/`<head>`                            |
| Standalone HTML download | `downloadHtml()` (`js/export.js`)                                              | The complete compiled document, saved as a `.html` file                                                                                                                      |
| Project JSON download    | `downloadProjectJson()` (`js/export.js`)                                       | The versioned project record from `js/storage.js` (§8) — configuration, theme snapshot, overrides — not compiled HTML                                                        |
| Asset manifest           | `downloadAssetManifest()` (`js/export.js`)                                     | `{ schemaVersion, assets: [...] }` describing media that could not be inlined                                                                                                |

## Media resolution during export

`prepareMediaExport(config, options)` walks the (already-sanitized) configuration and, for every media reference, resolves it against IndexedDB (`js/media-storage.js`, §9):

- **Small raster images** (`kind === 'image'`, not SVG, `size <= SMALL_IMAGE_INLINE_LIMIT` — 1 MB) are converted to a `data:` URL and inlined directly into the exported HTML.
- **Everything else** (SVG, large images, audio, video, captions) is assigned a unique `assets/<filename>` relative path, recorded in the manifest, and added to the internal Blob list — but **no archive is produced today**. The single-file HTML download is blocked with a warning toast when any asset requires this path, so a user never receives a broken "self-contained" file referencing assets that don't exist. See `docs/KNOWN-ISSUES.md` for the ZIP/SCORM packaging status.

This resolution step is the one place export output legitimately differs from the live preview: preview always resolves media to a runtime `blob:` object URL (fast, session-scoped), while export resolves the same reference to either a `data:` URL or an `assets/...` path (portable, but requires the file to travel with the export). Both start from the identical compiled markup — only the _value a media reference resolves to_ changes, never which elements/attributes reference media.

## CSP and sandbox contract

Every compiled document embeds this Content-Security-Policy, unconditionally, regardless of destination (preview, popout, or export):

```
default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com data:; img-src 'self' http: https: data: blob:;
media-src 'self' http: https: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'
```

Full rationale is in `docs/SECURITY.md`. The relevant export-contract point: **the CSP is part of the compiled string, so it travels with every export automatically** — an exported standalone HTML file, an embedded `srcdoc` iframe, and the live preview are equally protected, because they are the same bytes.

The iframe embed snippet additionally sets `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"` on the `<iframe>` element itself (a host-page-level restriction, separate from the document's own CSP). A consuming LMS/CMS that strips or rejects these sandbox flags is an external compatibility constraint outside this application's control — see `docs/KNOWN-ISSUES.md`.

## Rise/LMS output contract

The only communication a generated/exported component initiates toward its host page is documented in `docs/ARCHITECTURE.md` §11 — a single fixed-shape `postMessage` on completion. This message is part of the compiled `<script>` and therefore, per the single-compiler guarantee above, identical in preview, popout, and every export format.

## Non-goals of this contract

- It does not guarantee exported HTML renders identically in every host (Rise, Moodle, a raw browser) — only that the _bytes the application produces_ are identical across every export surface. Host-specific rendering differences are covered in `docs/KNOWN-ISSUES.md`.
- It does not (yet) guarantee full component portability — media files referenced via `assets/...` paths are not currently packaged into a downloadable archive (ZIP/SCORM placeholder, see `docs/KNOWN-ISSUES.md`).
- It does not cover the _application's own_ production build (`build.mjs`, `docs/ARCHITECTURE.md` "Build" section) — that assembles the builder app for hosting and is unrelated to a user's exported component output.
