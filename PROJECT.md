# Rise Component Builder

## Product purpose

Rise Component Builder is a browser-based internal authoring tool for creating configurable interactive eLearning blocks intended for embedding in Articulate Rise or another HTML-capable learning environment. It provides a component catalog, schema-driven content editing, styling controls, an isolated live preview, local project persistence, and self-contained HTML-oriented exports.

## Intended users

- Instructional designers and eLearning developers
- Learning experience and content-design teams
- Front-end developers preparing custom Rise blocks
- Subject-matter experts working from predefined interaction templates

## Current features

- Searchable component catalog organized by category
- Favorites stored locally
- Schema-driven item editor supporting text, textarea, number, range, select, checkbox, radio, color, URL, image, audio, video, and rich-text fields
- Multiline block labels/categories and headlines with preserved preview/export line breaks
- Add, duplicate, delete, move, drag-reorder, and collapse item cards
- Inline field validation
- Component styling for colors, border radius, borders, shadows, icons, and font selection
- Versioned exported-component themes with seven built-in presets, custom theme CRUD, import/export, defaults, live thumbnails, and WCAG contrast reporting
- Per-component theme overrides for primary/accent/background/text colors, radius, shadow, and font with one-action reset
- Behavior and completion-tracking controls
- Responsive live preview inside a sandboxed `srcdoc` iframe
- Keyboard and screen-reader behavior for the primary generated interactions
- Light/dark application-shell mode
- Versioned local projects with New, Save, Save As, Open, Rename, Duplicate, Delete, JSON import/export, autosave, and draft restoration
- Persisted application settings and component favorites
- Toast notifications
- Defensive HTML, attribute, URL, rich-text, CSS, and inline-script sanitization
- Reusable browse/drag-and-drop media uploads with previews, replacement, removal, metadata, and external-URL fallback
- Optional per-item custom icon/image uploads for Flip Card faces, Information Grid cards, and Audio Player artwork, with built-in fallbacks
- Visible image-upload guidance listing supported formats, limits, and schema-specific preferred dimensions
- IndexedDB storage for uploaded images, audio, video, posters, and WebVTT captions
- Media-aware standalone export validation and ZIP asset-manifest preparation

## Supported component types

- Responsive Accordion
- 3D Flip Cards
- Horizontal Tabs
- Interactive Hotspots
- Quick Link Buttons
- Secondary Menu Drawer
- Multiple Choice Check
- Sorting Activity
- Fill in the Blank
- Vertical Timeline
- Horizontal Timeline
- Process Flow
- Branching Scenario
- Profile Cards
- Information Grid
- Comparison Cards
- Audio Player
- Video Player
- Image Gallery
- AI Scenario Generator placeholder
- AI Quiz Generator placeholder

## Technology stack

- Vanilla HTML5
- Vanilla CSS
- Native JavaScript ES modules
- Browser `localStorage` for projects, drafts, favorites, settings, custom themes, default component theme, and application UI theme
- Browser IndexedDB for uploaded media Blobs
- Browser Blob/Object URL APIs for downloads
- Sandboxed iframe `srcdoc` for previews and embed output
- Vitest with jsdom for unit and integration tests
- Playwright Chromium and axe-core for browser and automated accessibility tests
- Google Fonts loaded from the web for the builder and generated previews

There is no application framework, production bundler, backend, or external database. npm is used only for pinned test tooling and CI commands.

## Current export options

- Self-contained iframe snippet using `srcdoc`
- Paste-friendly HTML fragment containing style, markup, and script
- Downloadable standalone HTML document
- Versioned project JSON download and import
- Versioned theme JSON download and import
- ZIP and SCORM choices are visible in settings/UI, but package generation is not implemented

## Known limitations

- Only five component generators are separated into `components/`; remaining generators are coupled to `js/preview.js`.
- Theme values are centralized, but some legacy component layout values remain in the shared preview stylesheet rather than being represented as design tokens.
- Default content for remaining legacy components is coupled to `app.js`.
- Media is local to the current browser profile and is not included in project JSON files.
- Single-file HTML export embeds only small raster images; SVG, large images, audio, video, and captions require future ZIP packaging.
- ZIP and SCORM export are placeholders.
- AI generation is a local timed simulation, not a connected AI service.
- Several generated examples depend on external media and Google Fonts being available online.
- The application is a local browser MVP and has no collaboration, authentication, server sync, or deployment workflow.
- Chromium is the initial automated browser target; Firefox, WebKit, Rise, Moodle, and assistive-technology verification remain manual.

See `docs/KNOWN-ISSUES.md` for confirmed implementation details, `docs/ARCHITECTURE.md` for module boundaries, `docs/COMPONENT-SCHEMA.md` for the data model, `docs/EXPORT-CONTRACT.md` for how preview and export stay in sync, `docs/SECURITY.md` for the sanitization/threat model, and `docs/TESTING-STRATEGY.md` for the test/lint/typecheck/build pipeline.

## MVP objectives

- Preserve a simple framework-free authoring workflow.
- Provide reusable, configurable eLearning interactions.
- Keep generated components isolated from the builder UI.
- Maintain safe interpolation of author-provided content.
- Provide WCAG-oriented generated output and authoring validation.
- Persist projects reliably in the browser.
- Produce portable HTML-oriented output.
- Maintain durable local media storage without putting binary files in localStorage.
