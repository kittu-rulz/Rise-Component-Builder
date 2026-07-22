# Known issues

Only confirmed or directly observable implementation limitations are listed here.

## Placeholders

- AI Scenario Generator and AI Quiz Generator use a local timer and hardcoded example output. They do not call an AI service.
- ZIP and SCORM selections are visible, but the package button only shows a warning. No ZIP or SCORM archive is generated.
- The sidebar storage meter displays a fixed `45% Used` value rather than measured browser storage usage.
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
- Renaming and creating custom themes currently use the browser prompt UI; results and errors use reusable toasts.
- Inline editor errors are rendered, but preview updates continue and project saving is not blocked by component-field validation.
- Project deletion uses `window.confirm`; normal notifications otherwise use the toast system.
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
- Builder modals are visually presented as dialogs but currently lack complete dialog roles, focus trapping, Escape handling, and focus restoration.
- Catalog selection cards are clickable `div` elements rather than native buttons or links.
- Alternative text/decorative choices and audio/video alternatives use visible, non-blocking warnings. Conditional field hiding is not implemented.
- Theme contrast checks cover the configured token pairs at authoring time, but they cannot guarantee contrast for arbitrary uploaded imagery, rich text, browser states, or all component-specific combinations.
- Playwright tracks modal focus trapping and trigger-focus restoration as explicit `fixme` checks; these are not counted as passing accessibility coverage.

## Security and escaping

- Author content passes through context-specific sanitizers before generated output, and automated hostile-input tests are present.
- The generated document necessarily permits inline style and script through its Content Security Policy.
- The preview iframe combines `allow-scripts` and `allow-same-origin`; this is needed by current rendering behavior but weakens sandbox isolation if unsafe markup were introduced later.
- `openPreview()` uses `document.write()` with the generated sanitized document. Any future generator bypassing shared sanitization would expand risk.
- File extension, MIME type, and basic file signatures are validated. Signature checks reduce accidental/spoofed mismatches but are not a substitute for server-side malware scanning.

## Large-file handling

- Default file-size limits are enforced in code but are not yet exposed as application settings.
- IndexedDB writes and browser metadata parsing still require the browser to hold selected file data temporarily; files near the 100 MB video limit can cause memory pressure on constrained devices.
- Browser storage quotas vary and the fixed sidebar storage meter does not report actual IndexedDB usage.

## Test coverage limitations

- Chromium is the only automated browser project. Firefox, WebKit, mobile Safari behavior, and real touch/assistive-technology combinations are not automated.
- Automated E2E tests use a local static server, not Articulate Rise, Moodle, an LMS, or a production CSP/hosting configuration.
- Unit coverage gates apply to state, persistence, themes, utilities, and the five modular generators. The large legacy preview compiler is exercised through integration and browser tests rather than included in the unit percentage.
- No pixel-diff snapshots are maintained; visual regressions still require design review at representative viewport sizes.
