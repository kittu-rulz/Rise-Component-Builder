# Architecture

This document describes the implementation currently present in the repository. Future recommendations are not represented as completed functionality.

## Folder structure

```text
v2/
├── index.html                 Application shell and modal markup
├── styles.css                Builder UI styles
├── app.js                    Application orchestration and legacy defaults
├── package.json              Test commands and development-only dependencies
├── vitest.config.js          Unit/integration coverage configuration
├── playwright.config.js      Browser test and local server configuration
├── TESTING.md                Test authoring, debugging, and manual checks
├── js/
│   ├── state.js              In-memory application state and base config
│   ├── catalog.js            Component metadata and catalog rendering
│   ├── storage.js            Versioned localStorage persistence
│   ├── themes.js             Theme presets, validation, resolution, and contrast checks
│   ├── editor-schemas.js     Per-component item-field schemas
│   ├── editor.js             Schema-driven editor rendering and validation
│   ├── preview.js            Generated document, CSS, legacy generators, runtime interactions
│   ├── export.js             Embed/fragment payloads and downloads
│   ├── media.js              File rules, signatures, SVG safety, references, accessibility checks
│   ├── media-storage.js      IndexedDB records and runtime object-URL lifecycle
│   ├── media-upload.js       Reusable browse/drop/preview upload control
│   ├── utilities.js          Escaping, sanitization, URL and Blob helpers
│   └── toast.js              Reusable toast notifications
├── components/
│   ├── accordion.js
│   ├── tabs.js
│   ├── flip-cards.js
│   ├── vertical-timeline.js
│   └── multiple-choice.js
└── tests/
    ├── fixtures/             Reusable project/theme/content fixtures
    ├── setup/                Vitest setup and cleanup
    ├── unit/                 Focused utilities/state/storage/generator tests
    ├── e2e/                  Playwright shell/editor/component/export/a11y tests
    ├── security.test.mjs
    ├── accessibility.test.mjs
    ├── media.test.mjs
    └── themes.test.mjs
```

## Application initialization flow

1. `index.html` loads `app.js` as an ES module.
2. `app.js` imports state, storage, catalog, editor, preview, export, utility, toast, and modular component APIs.
3. On `DOMContentLoaded`, persisted application UI theme, settings, favorites, custom themes, and default component theme are loaded.
4. DOM references and event handlers are registered.
5. `init()` applies the application UI theme, synchronizes settings, renders the catalog, and restores a valid autosaved draft when available.
6. Selecting a component initializes its default items, renders the schema-driven editor, and writes a generated document to the preview iframe.

## State management

`js/state.js` exports one mutable `appState` object. It holds the current project identity, selected component, independent builder UI mode, active exported-component theme snapshot, component overrides, catalog filters, favorites, settings, and active component configuration. Modules do not use a reactive store. `app.js` mutates this object and explicitly calls render, preview, and persistence functions.

The base component configuration includes shared header text, colors, layout values, behavior flags, completion settings, and an `items` array. Component selection replaces the items with component defaults while retaining shared style state.

## Theme system

`js/themes.js` is the single source for the theme schema and the seven built-in presets. It validates required metadata, supported schema versions, six-digit colors, font allowlists, radius and animation ranges, shadow values, and spacing densities. It also resolves per-component overrides into a complete token set and maps those values onto legacy config properties used by existing generators.

The Theme Manager in `index.html` is orchestrated by `app.js`. Built-in themes cannot be deleted; locked company themes expose duplication rather than direct editing. Custom themes are persisted independently from projects. A project stores both its full active theme snapshot and its component overrides, so it continues rendering if a custom theme is later removed from the global library. The builder's `data-theme` light/dark mode is stored and applied separately.

Contrast evaluation reports WCAG AA normal- and large-text results for authored token pairs. Suggestions are advisory and are never applied automatically.

## Component catalog

`js/catalog.js` contains static metadata for every catalog entry: identifier, display title, description, category, and icon. It attaches the schema returned by `getEditorSchema()` to each entry. Catalog filtering handles category, favorites, and text search.

Five component implementations are registered from `components/*.js`. Each exposes identity metadata, defaults, an editor schema, HTML/CSS/JS generators, and validation. Other component markup still branches on `componentId` inside `js/preview.js`, and their example defaults are selected in `app.js`.

## Editor rendering flow

`js/editor-schemas.js` defines item fields for every catalog component. `js/editor.js` renders those definitions into item cards. It owns generic field creation, item actions, reordering, collapsible cards, required indicators, inline errors, and supported field types.

`app.js` supplies `appState.config.items` to the editor and receives a generic `onChange` callback. Changes update the preview and schedule draft persistence. Shared header/style/behavior fields remain static markup in `index.html` and are synchronized directly by `app.js`.

Clicking Save re-runs the same schema field validation (`validateSchemaField`), the active schema's `minItems`, and the selected component's `validate()` contract via `collectValidationErrors()` in `app.js`. If any check fails, the Save dialog does not open; a toast names the first failing field and the Content tab is activated so the author can fix it immediately. Renaming an already-saved project bypasses this gate, since it only edits stored project metadata rather than persisting the current in-progress configuration.

Image, audio, video, and caption-capable fields delegate to `js/media-upload.js`. The control supports external URLs, browsing, drag/drop, preview, metadata, replacement, removal, and multiple selection when enabled by schema. Files are validated and stored before a JSON-safe media reference is written to component configuration. Component-level schema fields are used for hotspot background media; item-level fields cover profiles, gallery items, audio, and video.

Per-type maximum file sizes are configurable in Builder Settings (`settings.mediaLimitsMb`, normalized and bounds-clamped in `js/storage.js`) instead of being fixed to the `MEDIA_LIMITS` defaults in `js/media.js`. `resolveMediaLimits()` converts the author's MB values to bytes; `app.js` recomputes and passes the resulting limits object into `schemaItemEditor.render()` on every render, which threads it through to each `createMediaUploadControl()` call so both upload validation and the on-screen size guidance stay in sync with the configured limits.

Optional illustrative artwork uses the same image control and IndexedDB reference lifecycle. Flip Card faces, Information Grid cards, and Audio Player tracks expose `iconImage`, `iconAltText`, `iconDecorative`, and `iconFit`. Empty or removed artwork values render the existing built-in SVG, so projects retain their previous appearance by default. Functional control symbols such as accordion expand indicators and media play/pause controls are intentionally not author-replaceable.

Every image schema supplies `preferredDimensions`. The reusable upload control displays that recommendation together with the accepted JPG/JPEG, PNG, WebP, SVG, and GIF formats and enforced file-size limits. This guidance is referenced by `aria-describedby`; dimensions are advisory and do not reject otherwise valid images.

## Live-preview generation

`app.js` calls `generateIframeContent()` in `js/preview.js`, passing the application state, modular component registry, and color helper. The preview module:

1. Resolves the active component theme and overrides, then sanitizes configuration for the selected component.
2. Delegates to a registered component module when one exists, otherwise uses a legacy component branch.
3. Produces a complete HTML document containing scoped CSS and interaction JavaScript.
4. Includes a Content Security Policy and accessibility behavior.
5. Writes the document to `iframe.srcdoc` through `writePreview()`.

The preview compiler also supplies the content used by standalone and iframe exports, so changes there affect preview and export behavior together.

## Export process

`js/export.js` currently provides:

- `buildExportPayload(fullHtml)` for a `srcdoc` iframe snippet and extracted HTML fragment
- `downloadHtml(title, html)` for a complete standalone HTML download
- `downloadProjectJson(project)` for project JSON
- media transformation that embeds small raster images, creates `assets/...` paths for non-inline assets, and builds a manifest plus internal Blob list for future ZIP packaging

`app.js` populates the export modal, copies snippets to the clipboard, and initiates downloads. The ZIP/SCORM button currently displays a warning rather than creating a package.

## Persistence

`js/storage.js` uses versioned localStorage keys. Project schema version 2 contains project identity, component ID, timestamps, configuration, a full component-theme snapshot, component overrides, independent application UI mode, and normalized settings. Version-1 projects migrate on read while preserving their prior visual values as overrides. Storage also implements project CRUD, duplicate, import/export validation, autosaved drafts, favorites, settings, custom themes, the default theme, and UI-mode persistence. Media references and metadata are allowed as validated nested JSON values, while Blob and object-URL properties are rejected.

Project configuration is restricted to JSON-compatible primitive item values. Invalid or unsupported project versions are rejected before being applied. Binary files are not stored separately.

## Media storage

`js/media-storage.js` owns the version-1 `rise-component-builder-media` IndexedDB database and its `media` object store. Stored records include metadata and a Blob. Component/project configuration stores only a media reference containing the media ID and metadata.

When media is uploaded, a validated record is written to IndexedDB and a registered object URL is created for the current session. Reopening a project scans its references, loads the corresponding records, and recreates object URLs. Preview compilation resolves references to those runtime URLs. Replaced, removed, and inactive references cause unused runtime URLs to be revoked; all remaining URLs are revoked on page unload. Object URLs are never persisted.

## Important dependencies

- `app.js` is the central coordinator and depends on every module.
- `catalog.js` depends on `editor-schemas.js`.
- `editor.js` depends on `editor-schemas.js` and rich-text sanitization in `utilities.js`.
- `preview.js` depends on sanitization/serialization utilities and on the component registry supplied by `app.js`.
- Modular generators depend on `editor-schemas.js` and `utilities.js`.
- `storage.js` defines the project format consumed by `app.js` and JSON export.
- `themes.js` defines theme validation and token resolution consumed by state, storage, app orchestration, and preview generation.
- `export.js` consumes the complete document produced by `preview.js`.
- `media-upload.js` depends on validation in `media.js` and persistence in `media-storage.js`.
- `preview.js` resolves runtime media references through `media-storage.js` before sanitizing component URLs.
- `export.js` reads IndexedDB records and applies the single-file/asset-manifest media policy.
- `index.html` element IDs and `styles.css` class names are coupled to selectors in `app.js` and `editor.js`.

## Automated test architecture

Vitest runs module-level and generated-output integration tests. DOM parsing uses jsdom only where necessary. V8 coverage gates the directly unit-tested state, storage, theme, utility, and modular generator layers at 70% statements, 60% branches, 70% functions, and 70% lines.

Playwright starts `tests/e2e/server.mjs` against the local workspace and drives Chromium, Firefox, and desktop WebKit (`playwright.config.js`) without requiring a hosted environment. Browser suites cover the shell, schema editor, iframe preview, five modular interactions, persistence, downloads, responsive sizes, and selected accessibility checks, including builder modal focus trapping and trigger-focus restoration. axe-core inspects stable builder regions; iframe semantics also receive direct role, state, focus, and reference assertions. Tests that depend on Chromium-only Playwright permission grants (clipboard read/write) or on a WebKit-on-Windows IndexedDB Blob limitation degrade gracefully per-browser rather than failing outright — see Test coverage limitations in KNOWN-ISSUES.md. GitHub Actions runs both layers and retains failure traces, screenshots, videos, and coverage reports.
