# Known issues

Only confirmed or directly observable implementation limitations are listed here.

## Placeholders

- AI Scenario Generator and AI Quiz Generator use a local timer and hardcoded example output. They do not call an AI service.
- ZIP and SCORM selections are visible, but the package button only shows a warning. No ZIP or SCORM archive is generated.
- The export modal contains initial example code in the HTML source, although `app.js` replaces it with generated output when the modal opens.

## Coupling and duplication

- Only Accordion, Tabs, Flip Cards, Vertical Timeline, and Multiple Choice are separate component modules.
- Remaining generator markup, styles, and interaction logic are concentrated in the large `js/preview.js` file.
- Remaining component sample/default data is selected through a long conditional in `app.js`.
- Shared interaction CSS and component-specific CSS are emitted from one preview template, so a change can affect unrelated generated components.
- Theme tokens centralize common colors, typography, radius, shadow, density, and motion values, but not every legacy component-specific spacing or decorative value has been tokenized.
- Component schemas exist for all catalog entries, but legacy generators do not expose independent `validate()` contracts.

## Persistence and validation

- Projects, drafts, favorites, settings, custom themes, the default component theme, and UI mode are persisted in localStorage only. There is no server synchronization or multi-user support.
- Project schema version 2 validates theme snapshots and overrides and migrates version-1 projects, but it has no component-specific migration or deep schema validation.
- Renaming and creating custom themes, and confirming project/theme deletion, use in-app modal dialogs (`#modal-prompt`, `#modal-confirm`) rather than the browser's native `prompt`/`confirm`; results and errors use reusable toasts.
- Inline editor errors are rendered, and preview updates continue live regardless; clicking Save re-validates all required schema fields, `minItems`, and (for the five modular components) their `validate()` contract, and blocks saving with a toast naming the first failing field until it is fixed. Legacy components without a `validate()` contract are only checked at the field level.
- Importing a project creates a new project identity, but external resources referenced by its URLs are not copied or verified.

## Media limitations

- Uploaded Blobs are durable only in the current browser profile. Project JSON contains references and metadata, not the media files themselves.
- Importing a media-bearing project JSON on another browser reports missing local records; media must be supplied separately by future package support.
- Removing or replacing media revokes unused runtime object URLs, but orphaned IndexedDB records are not yet garbage-collected automatically because saved projects may still reference them.
- Duration metadata depends on the browser successfully reading audio/video metadata.
- SVG sanitization intentionally rejects the complete file when it contains unsafe elements, handlers, script URLs, embedded HTML, or external references; it does not attempt a lossy repair.
- Custom item artwork is currently available for Flip Cards, Information Grid, and Audio Player. Functional interaction symbols—including accordion state indicators, quiz controls, and play/pause buttons—remain fixed to protect recognizable controls and their accessibility behavior.

## Export limitations

- Self-contained `srcdoc` output depends on browser support and the permissions in the iframe sandbox.
- HTML fragment export assumes the target accepts inline styles and scripts.
- External media and Google Fonts require network access after export.
- Small raster images can be embedded in standalone HTML. SVG, large images, audio, video, and captions are converted to asset-relative paths and block the single-file download with a warning.
- The ZIP preparation layer produces a manifest and internal Blob list, but it does not yet create or download an archive containing those assets.

## Accessibility gaps

- Generated component output includes WCAG-oriented semantics and keyboard handling, but conformance still requires manual assistive-technology testing with authored content.
- Alternative text/decorative choices and audio/video alternatives use visible, non-blocking warnings. Conditional field hiding is not implemented.
- Theme contrast checks cover the configured token pairs at authoring time, but they cannot guarantee contrast for arbitrary uploaded imagery, rich text, browser states, or all component-specific combinations.

## Security and escaping

- Author content passes through context-specific sanitizers before generated output, and automated hostile-input tests are present.
- The generated document necessarily permits inline style and script through its Content Security Policy.
- The preview iframe combines `allow-scripts` and `allow-same-origin`; this is needed by current rendering behavior but weakens sandbox isolation if unsafe markup were introduced later.
- `openPreview()` uses `document.write()` with the generated sanitized document. Any future generator bypassing shared sanitization would expand risk.
- File extension, MIME type, and basic file signatures are validated. Signature checks reduce accidental/spoofed mismatches but are not a substitute for server-side malware scanning.

## Large-file handling

- Per-type media upload size limits (image, audio, video, SVG) are configurable in Builder Settings and persisted in `settings.mediaLimitsMb`; each is clamped to a safe range (e.g. image 1-50 MB, video 1-500 MB) and invalid values silently fall back to the built-in default rather than rejecting the save. The captions (WebVTT) limit is fixed at 2 MB and is not configurable, since caption files are always small text.
- IndexedDB writes and browser metadata parsing still require the browser to hold selected file data temporarily; files near the configured video limit (100 MB by default) can cause memory pressure on constrained devices.
- The sidebar storage meter uses `navigator.storage.estimate()`, which reports the browser's whole-origin quota usage (localStorage plus IndexedDB) rather than an exact application-level breakdown; it also falls back to "Usage unavailable" in browsers without the Storage API.

## Test coverage limitations

- Chromium, Firefox, and desktop WebKit are automated Playwright projects. Mobile Safari behavior and real touch/assistive-technology combinations are not automated.
- One test (`flip-card custom artwork uploads per face and removal restores the built-in icon`) is skipped on WebKit: Playwright's bundled WebKit build on Windows cannot store a `Blob` in IndexedDB at all in this environment (reproduced with zero application code — a bare `indexedDB.open(...).put({ blob })` fails with `"Error preparing Blob/File data to be stored in object store"`). This is a Playwright/WebKit-on-Windows test-environment limitation, not an app defect; real Safari is unaffected.
- Firefox and WebKit don't support Playwright's `clipboard-read`/`clipboard-write` permission grants (a Chromium-only CDP permission). The export copy-to-clipboard test verifies the visible success state (button text/class, toast) on all three engines, but only reads back the actual clipboard contents on Chromium.
- Automated E2E tests use a local static server, not Articulate Rise, Moodle, an LMS, or a production CSP/hosting configuration.
- Unit coverage gates apply to state, persistence, themes, utilities, and the five modular generators. The large legacy preview compiler is exercised through integration and browser tests rather than included in the unit percentage.
- No pixel-diff snapshots are maintained; visual regressions still require design review at representative viewport sizes.
