# Architecture

This document describes the implementation currently present in the repository and defines the module boundaries the project is expected to keep going forward. It supersedes the root-level `ARCHITECTURE.md`, which is now a pointer to this file. Recommendations that are not yet implemented are explicitly labeled **Planned**; everything else describes shipped behavior.

Rise Component Builder is intentionally framework-free: vanilla HTML5, vanilla CSS, and native browser ES modules, with no bundler, backend, or database. `npm` exists only for pinned dev tooling (tests, linting, type-checking, and a static-file production build). This document's job is to keep that simplicity from turning into an unmaintainable single-file application as the component count grows — by drawing hard lines between the eleven areas below and saying, module by module, which file owns which responsibility.

## Folder structure

```text
v2/
├── index.html                 Application shell and modal markup; loads app.js as the sole entry module
├── styles.css                 Builder UI styles
├── app.js                     Application orchestration: DOM wiring, event handlers, state mutation
├── package.json                Scripts: dev, test, lint, format, typecheck, build, validate
├── eslint.config.js            Flat ESLint config (browser app code, Node scripts, test code)
├── .prettierrc.json             Formatting rules
├── tsconfig.json                Incremental JSDoc-based type checking (checkJs, allowJs, noEmit)
├── build.mjs                    Production static-site build (see docs/EXPORT-CONTRACT.md is not relevant here — see §5 Build)
├── vitest.config.js             Unit/integration coverage configuration
├── playwright.config.js         Browser test and local server configuration
├── js/
│   ├── state.js                In-memory application state and base config           → §1/§8 boundary
│   ├── catalog.js              Component registry metadata and catalog rendering      → §1 boundary
│   ├── editor-schemas.js       Per-component item-field schemas                       → §2 boundary
│   ├── editor.js               Schema-driven editor rendering and validation          → §3/§10 boundary
│   ├── storage.js              Versioned localStorage persistence                     → §8 boundary
│   ├── themes.js               Theme presets, validation, token resolution, contrast  → §6 boundary
│   ├── preview.js              Shared HTML/CSS/JS compiler + iframe/popout writers    → §4/§5 boundary
│   ├── export.js               Export payload assembly, media asset packaging, downloads → §5 boundary
│   ├── media.js                File rules, signatures, SVG safety, a11y warnings       → §9/§10 boundary
│   ├── media-storage.js        IndexedDB records and runtime object-URL lifecycle      → §9 boundary
│   ├── media-upload.js         Reusable browse/drop/preview upload control             → §3/§9 boundary
│   ├── utilities.js            Escaping, sanitization, URL/Blob helpers                → §7/§10 boundary
│   └── toast.js                Reusable toast notifications
├── components/                 Modular component registrations (registry entries)      → §1 boundary
│   ├── accordion.js
│   ├── tabs.js
│   ├── flip-cards.js
│   ├── vertical-timeline.js
│   ├── multiple-choice.js
│   └── multiple-select.js
├── docs/                        Canonical documentation (this file and its siblings)
└── tests/
    ├── fixtures/                Reusable project/theme/content fixtures
    ├── setup/                   Vitest setup and cleanup
    ├── unit/                    Focused utilities/state/storage/generator tests
    ├── e2e/                     Playwright shell/editor/component/export/a11y tests
    ├── security.test.mjs
    ├── accessibility.test.mjs
    ├── media.test.mjs
    └── themes.test.mjs
```

## Application initialization flow

1. `index.html` loads `app.js` as an ES module — the only `<script>` tag in the document, and the only module Node/browser tooling needs to treat as an entry point.
2. `app.js` imports state, storage, catalog, editor, preview, export, utility, toast, and the modular component registry.
3. On `DOMContentLoaded`, persisted application UI theme, settings, favorites, custom themes, and the default component theme are loaded from `js/storage.js`.
4. DOM references and event handlers are registered.
5. `init()` applies the application UI theme, synchronizes settings, renders the catalog, and restores a valid autosaved draft when available.
6. Selecting a component initializes its default items, renders the schema-driven editor, and writes a generated document to the preview iframe via the **same compiler** used for export (§4/§5).

## The eleven architectural boundaries

Each boundary below names the file(s) that own it, what may cross the boundary, and what must not.

### 1. Component registry

**Owns:** `js/catalog.js` (catalog metadata: id, title, description, category, icon) + `components/*.js` (behavior: `id`, `name`, `category`, `defaultConfig`, `editorSchema`, `generateHTML`, `generateCSS`, `generateJS`, `validate`).

The registry is the map from a `componentId` string to everything needed to edit, preview, and export that component. `app.js` builds `componentRegistry` once at module load by importing every `components/*.js` module and indexing it by `id`:

```js
const componentRegistry = Object.fromEntries(
  [accordion, tabs, flipCards, verticalTimeline, multipleChoice, multipleSelect].map(component => [component.id, component])
);
```

**Current state:** 6 of 21 catalog entries (`accordion`, `tab-blocks`, `flip-cards`, `vertical-timeline`, `multiple-choice`, `multiple-select`) are registered this way. The remaining 15 are _not yet in the registry_ — their markup/CSS/JS generation is a conditional branch inside `js/preview.js` (§4), and their default sample data is a conditional in `app.js`, keyed by the same `componentId` strings that `js/catalog.js` defines. This is tracked as debt, not hidden: see `docs/KNOWN-ISSUES.md`. **The registry contract itself (the five function names and the metadata shape) is the target every future component migration must match — no new component-specific special forms should be invented.**

**Rule going forward:** a new component is "registered" only when it exports the same five-function/`defaultConfig`/`editorSchema` shape as the existing six. Nothing outside `components/*.js` and `js/catalog.js` should need to know a component's id to add support for it (the current legacy branches in `preview.js`/`app.js` are the exception being paid down, not the pattern to extend).

### 2. Component data / schema

**Owns:** `js/editor-schemas.js` (per-component `itemFields`/`componentFields`, `minItems`, `itemLabel`) and, for the 6 registered components, each component module's own `editorSchema`/`defaultConfig` export.

A schema is data, not behavior: a list of field descriptors (`id`, `label`, `type`, `default`, `required`, `min`/`max`, `pattern`, `options`, …). `js/catalog.js` attaches the resolved schema to each catalog entry via `getEditorSchema(componentId)`. `createDefaultItem(schema)` derives a blank item purely from that schema. Full schema field semantics live in `docs/COMPONENT-SCHEMA.md`.

**Rule:** schema files never touch the DOM and never generate HTML/CSS/JS strings. They describe shape and constraints only; `js/editor.js` (§3) and `js/preview.js` (§4/§5) are the only consumers allowed to act on that shape.

### 3. Component editor configuration (authoring UI)

**Owns:** `js/editor.js` (generic schema-driven rendering: item cards, add/duplicate/delete/move/drag-reorder/collapse, per-field controls and inline errors) and `js/media-upload.js` (the reusable browse/drop/preview control used wherever a schema field has type `image`/`audio`/`video` or a `uploadKind`).

`app.js` supplies `appState.config.items` plus the active schema to `createSchemaItemEditor({ container, onChange })` and receives a generic `onChange` callback that triggers re-preview and draft persistence. Shared header/style/behavior fields (block title, colors, radius, behavior toggles) remain static markup in `index.html`, synchronized directly by `app.js` — they are not schema-driven because every component shares the same set of them.

**Rule:** `js/editor.js` never knows a specific `componentId`. It only knows field _types_ (`supportedEditorFieldTypes`) and the generic schema shape from §2. Component-specific authoring logic belongs in a component module's own code (for the 6 registered components) or is not yet supported (for the legacy 15).

### 4. Preview rendering

**Owns:** `js/preview.js` → `generateIframeContent(appState, componentRegistry, colorToRgba)`.

This function is the single HTML/CSS/JS document compiler for the whole application. It:

1. Resolves the active theme + component overrides into token values (`js/themes.js`, §6).
2. Sanitizes the component configuration for the selected `componentId` (`sanitizePreviewConfig`, `js/utilities.js`, §10).
3. Delegates to `componentRegistry[componentId]` when the component is registered (§1); otherwise falls back to a legacy conditional branch inside this same file.
4. Assembles one complete HTML document — CSP meta tag, scoped inline `<style>`, interaction `<script>` — and returns it as a string.
5. Live-preview callers write that string to `iframe.srcdoc` via `writePreview()`; the "pop out preview" affordance opens a new window and calls `document.write()` on the identical string via `openPreview()`.

**Rule — no forking:** `generateIframeContent()` is also the function §5 (export) calls. There must never be a second code path that independently re-implements a component's markup for export. If export needs something preview doesn't (e.g. asset URL rewriting), that transform is applied to preview's _output_, never by re-deriving markup from `appState` a second time. See `docs/EXPORT-CONTRACT.md` for the exact contract this guarantees.

**Preview device modes.** `js/device-preview.js` defines the fixed list of device widths the builder chrome offers (Desktop, Tablet 768px, Large Mobile 430px, Mobile 375px). Selecting one toggles a class on `#preview-viewport` (`.preview-viewport-wrapper`, `styles.css`) that sets a real CSS `width` on the wrapper the `<iframe>` lives inside — this is genuine layout width, not a `transform: scale()` visual trick, so any `@media` query a component's `generateCSS`/legacy branch ever authors will correctly react to it. The wrapper is a flex item, so it must carry `flex-shrink: 0` (plus a `max-width: 100%` safety clamp) or the flexbox algorithm silently shrinks it below its declared width whenever the preview panel itself is narrower than the requested device width — this was the original cause of "Mobile View doesn't reliably constrain to 375px" (the panel could be narrower than 375px at realistic window sizes, and both `.app-workspace` and `.preview-container` set `overflow: hidden`, so the shrink never surfaced as a scrollbar). Desktop mode caps at `min(100%, var(--component-max-width))`, where `--component-max-width` is set from `COMPONENT_MAX_WIDTH` (`js/preview.js`) — the same constant the generated document's own `.rise-block-wrapper { max-width }` uses, so "Desktop" always matches how wide an authored block can actually render, never wider. The selected mode is persisted (`loadPreviewDevice`/`savePreviewDevice`, `js/storage.js`) and, by design, is **not** reset when switching components — it reflects the author's current testing intent for the session, not a per-component default.

### 5. Export rendering

**Owns:** `js/export.js` (`buildExportPayload`, `prepareMediaExport`, `downloadHtml`, `downloadProjectJson`, `downloadAssetManifest`) plus `build.mjs` at the repo root (the _application's own_ production build — a distinct, unrelated concept from "exporting a generated component"; see the note at the end of this section).

`js/export.js` never generates component markup itself. It receives the already-compiled HTML string from §4 (`generateIframeContent()`, called once by `app.js` and passed in) and:

- wraps it as a `srcdoc` iframe embed snippet (`buildExportPayload`),
- extracts a paste-friendly `<style>`/body fragment (`generateHtmlFragment`, `js/utilities.js`),
- rewrites uploaded-media references into inlined data URLs (small raster images only) or `assets/...` relative paths plus a manifest (`prepareMediaExport`, reading Blobs from §9),
- and triggers browser downloads for standalone HTML, project JSON, or the asset manifest.

Full behavior, including the current single-file inlining limits and the ZIP/SCORM placeholder status, is specified in `docs/EXPORT-CONTRACT.md`.

**Note on `build.mjs`:** this new script (added for this phase) assembles the _builder application itself_ into `dist/` for static hosting (GitHub Pages). It is unrelated to a user's exported _component_ output — it does not run the preview compiler, does not touch `appState`, and does not change what ships inside a user's downloaded HTML. See "Build" further down in this document.

### 6. Shared design tokens

**Owns:** `js/themes.js`.

This is the single source of truth for the theme schema (`schemaVersion`, identity/lock metadata, timestamps, and the token set: `fontFamily`, `headingFontFamily`, 9 color tokens, `borderRadius`, `buttonRadius`, `shadow`, `spacingDensity`, `animationSpeed`), the 7 built-in presets, per-component override resolution (`resolveThemeTokens`), the legacy-property bridge (`applyThemeToConfig`, which maps tokens onto the `colorPrimary`/`colorAccent`/`colorBg`/`colorText`/`borderRadius`/`shadowDepth` properties the generators still read), and WCAG AA contrast evaluation (`validateThemeContrast` — advisory, never auto-applied).

**Rule:** no other module invents a color, radius, shadow, spacing, or font value outside this token set. `js/preview.js` and `js/utilities.js` (`sanitizeCSSColor`/`sanitizeCSSNumber`) only ever clamp/validate values that themes.js already defined as valid shapes — they do not introduce new design values of their own.

### 7. Shared accessibility utilities

**Owns:** cross-cutting, not a single file — the accessibility contract is split by concern:

- **Structural/semantic accessibility of generated output** (ARIA roles/states, keyboard handling, focus management, `aria-live` announcements) is generated per-component inside `js/preview.js` (legacy branches) or a component module's `generateHTML`/`generateJS` (the 6 registered components). There is currently no shared helper library for this — each generator writes its own ARIA wiring, which is why automated a11y coverage for the 15 unregistered components lags behind the 6 registered ones (`docs/KNOWN-ISSUES.md`).
- **Authoring-time accessibility guidance** (alt-text/decorative warnings, transcript/caption warnings) lives in `js/media.js` (`validateMediaAccessibility`) — always advisory `warnings`, never a blocking error, surfaced by `app.js`/`js/editor.js` next to the relevant field.
- **Contrast evaluation** lives in `js/themes.js` (§6).
- **Escaping that keeps assistive-technology-relevant text safe to render** (rich text, attributes) lives in `js/utilities.js` (§10).

**Planned:** extracting the repeated ARIA/keyboard patterns (roving tabindex, `aria-expanded` toggles, live-region announcements) that currently exist independently in each generator into one shared preview-side helper module, once enough of the 15 legacy components have been migrated into the registry (§1) for the duplication to be worth collapsing. Not done in this phase — see "Deferred work" in the project's audit trail.

### 8. Project persistence

**Owns:** `js/storage.js` (+ `js/state.js` for the in-memory shape it persists).

Versioned localStorage (`schemaVersion: 2`, migrating v0/v1 projects on read). Owns project CRUD (`saveProject`/`getProject`/`deleteProject`/`renameProject`/`duplicateProject`), import/export validation (`importProjectJson`/`validateProject`), autosave drafts, favorites, settings, custom themes, the default theme id, and UI-mode persistence. `js/state.js` owns the single mutable `appState` object that `app.js` reads/writes and that `storage.js` serializes.

**Rule:** nothing outside `js/storage.js` calls `localStorage` directly (grep-enforceable). Every write goes through `validateProject`/`normalizeSettings`/`validateTheme`, so a corrupted or hand-edited localStorage value can never silently become a corrupted `appState`.

### 9. Media storage

**Owns:** `js/media.js` (file/type/signature/size validation, SVG sanitization, accessibility warnings, media-reference shape) + `js/media-storage.js` (the IndexedDB `rise-component-builder-media` database, record CRUD, runtime object-URL lifecycle) + `js/media-upload.js` (§3's UI layer over both).

Binary data (Blobs) lives only in IndexedDB. Project/component configuration only ever stores a JSON-safe _reference_ (`{ source: 'upload', mediaId, schemaVersion, kind, name, mimeType, size, createdAt, duration }`) — `js/storage.js`'s `isSafeProjectValue` explicitly rejects any `blob`/`objectUrl` property reaching localStorage. Object URLs are created on demand and revoked on removal/unload; they are never persisted.

**Rule:** `js/preview.js`/`js/export.js` resolve a media reference to a usable URL only through `js/media-storage.js`'s `resolveMediaReference`/`resolveMediaReferencesForPreview` — no module reads `IndexedDB` directly except `media-storage.js`.

### 10. Validation

Validation is intentionally layered, not centralized in one file, because each layer guards a different trust boundary:

| Layer                              | Owner                                                                                                                                                   | Guards against                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Field-level authoring validation   | `js/editor.js` (`validateSchemaField`)                                                                                                                  | Required/format/length/pattern violations as the author types                                                            |
| Component business-rule validation | Each registered component's `validate(config)` (§1)                                                                                                     | Component-specific rules (e.g. "at least one correct answer") — only implemented for the 6 registered components today   |
| Save-time gate                     | `app.js` (`collectValidationErrors()`)                                                                                                                  | Re-runs field + `minItems` + `validate()` before a Save dialog opens; blocks with a toast naming the first failing field |
| Media file validation              | `js/media.js` (`validateMediaFile`, `hasExpectedFileSignature`, `sanitizeSVGText`)                                                                      | Wrong/spoofed file types, oversized files, unsafe SVG content                                                            |
| Persisted-data validation          | `js/storage.js` (`validateProject`), `js/themes.js` (`validateTheme`)                                                                                   | Corrupted/hand-edited localStorage or imported JSON reaching `appState`                                                  |
| Output sanitization                | `js/utilities.js` (`escapeHTML`/`escapeAttribute`/`sanitizeRichText`/`sanitizeURL`/`escapeJavaScriptString`), `js/preview.js` (`sanitizePreviewConfig`) | Author-controlled content escaping into executable/unsafe context in generated HTML                                      |

Full detail and the specific threat each sanitizer defends against is in `docs/SECURITY.md`.

### 11. Rise/LMS communication

**Owns:** the generated document's inline `<script>`, emitted by `js/preview.js` (§4), and nothing else — the _builder application_ has no network layer and no direct Rise/Moodle/LMS integration at all.

The only outbound communication the generated component ever performs toward its host page is a single, fixed-shape `postMessage`, sent once, when completion tracking is enabled and the learner finishes the interaction:

```js
window.parent.postMessage({ type: 'RISE_BLOCK_COMPLETE', status: 'completed' }, '*');
```

There is no inbound message listener, no other outbound message type, and no other channel (no `fetch`, no `XMLHttpRequest`, no `WebSocket`) — consistent with the generated document's CSP (`connect-src 'none'`, `docs/SECURITY.md`). Everything else described as "Rise/LMS" integration in the product docs (embedding the `srcdoc` iframe, pasting the HTML fragment, exporting standalone HTML) is a static-output concern owned by §5, not a live communication channel.

**Rule:** if real bidirectional LMS communication (e.g. reading a learner id, writing a SCORM score) is ever added, it must be introduced as an explicit, documented message contract here — not folded into the existing `RISE_BLOCK_COMPLETE` message or scattered across generator branches.

## Build

**New in this phase.** `npm run build` (`build.mjs`) assembles a `dist/` directory containing exactly the files the browser needs at runtime (`index.html`, `styles.css`, `app.js`, `js/`, `components/`) and verifies every local `<script src>`/`<link href>` reference in `index.html` resolves to a file that was actually copied. It does not bundle, minify, or transpile — there is no framework/bundler in this project by design (§1 architecture premise), and GitHub Pages serves static files directly, so "build" here means "produce a verified, deployable static tree," not "compile." This is intentionally the smallest possible build step that still catches a broken/missing file reference before deployment.

## Automated test architecture

Vitest runs module-level and generated-output integration tests; jsdom is used only where DOM parsing is required. V8 coverage gates the directly unit-tested state/storage/theme/utility/modular-generator layers at 70% statements / 60% branches / 70% functions / 70% lines. Playwright drives Chromium, Firefox, and desktop WebKit against a dependency-free local static server, covering the shell, schema editor, iframe preview, the six modular interactions, persistence, downloads, responsive sizes, and accessibility. Full strategy, browser-specific caveats, and the current commands are in `docs/TESTING-STRATEGY.md`.

## Important dependencies (who may import whom)

- `app.js` is the central coordinator and is the only module allowed to depend on _every_ other module — it is the composition root.
- `catalog.js` depends on `editor-schemas.js` only.
- `editor.js` depends on `editor-schemas.js`, `utilities.js` (rich-text sanitization), `media.js`, and `media-upload.js`.
- `preview.js` depends on `themes.js`, `utilities.js`, `media-storage.js`, and the component registry passed in by `app.js` — it does not import `components/*.js` directly, keeping the registry composition decision in `app.js`.
- `export.js` depends on `utilities.js`, `media.js`, and `media-storage.js`, and consumes (never regenerates) the HTML string produced by `preview.js`.
- `storage.js` depends on `media.js` (`isMediaReference`) and `themes.js` (theme validation) — it defines the project format everything else reads.
- `media-upload.js` depends on `media.js` (validation) and `media-storage.js` (persistence).
- `themes.js` and `utilities.js` have no dependencies on other project modules — they are the leaves of the dependency graph, which is why they carry the highest unit-test coverage requirement.
- `index.html` element IDs and `styles.css` class names are coupled to selectors in `app.js` and `editor.js` (not enforced by any module boundary — a refactor risk called out in `docs/KNOWN-ISSUES.md`).
