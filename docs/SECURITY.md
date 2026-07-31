# Security

This document specifies the threat model, the sanitization contract every generator must honor, and the currently known residual risks. It consolidates and supersedes the security-relevant sections previously scattered across the root `KNOWN-ISSUES.md`.

## Threat model

There is no backend, no database, and no server-side component in this application by design (`docs/ARCHITECTURE.md`). The realistic attack surface is therefore narrow and specific:

1. **Author-controlled content escaping into an executable context** inside generated HTML (the primary risk — an instructional designer's typed content, or an imported project JSON, ending up as live script/markup instead of inert text).
2. **Uploaded files smuggling executable content** (an SVG with a `<script>`, a mislabeled file whose real content differs from its declared type).
3. **Persisted data (localStorage/IndexedDB) being tampered with or corrupted** and re-entering `appState` unchecked, either directly in the browser or via a hand-edited/malicious imported project JSON file.
4. **The generated component's document escaping its intended sandbox** when embedded in a third-party host (Rise, Moodle, or any other page).

There is no SQL injection, command injection, or server-side request forgery surface, because there is no server.

## Sanitization contract (`js/utilities.js`)

Every function below is a hard boundary: content must pass through the correct one before reaching generated output. This is the mechanism that keeps §10 of `docs/ARCHITECTURE.md` (Validation) actually enforced rather than aspirational.

| Function                                 | Used for                                                      | Behavior                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `escapeHTML` / `escapeHtml`              | Plain text interpolated into HTML                             | Escapes `& < > " '`                                                                                                                                                                                                                                                                   |
| `escapeAttribute`                        | Text interpolated into an HTML attribute                      | `escapeHTML` plus backtick/CR/LF/tab escaping                                                                                                                                                                                                                                         |
| `sanitizeRichText`                       | Rich-text fields (item content, labels, transcripts)          | Allowlists `p, br, strong, b, em, i, u, ul, ol, li` and a narrowly-parsed `<a href="...">` (URL itself passed through `sanitizeURL`); everything else is HTML-escaped, not stripped silently                                                                                          |
| `sanitizeURL`                            | Any URL-shaped value (links, media `src`, background images)  | Rejects `javascript:`/`vbscript:` outright; constrains `data:` to a fixed image-MIME allowlist (`png/jpeg/gif/webp/avif`, base64 only); constrains `blob:` to URLs the app itself registered (`localBlobURLs`); otherwise requires `http:`/`https:` and a `new URL()`-parseable value |
| `escapeJavaScriptString`                 | Values interpolated into inline `<script>` string literals    | Escapes backslash, quotes, backtick, `$`, angle brackets, `&`, line/paragraph separators                                                                                                                                                                                              |
| `serializeForInlineScript`               | Structured values interpolated into inline `<script>` as JSON | `JSON.stringify` plus `< > &` and line/paragraph-separator escaping (defeats `</script>` breakout and JSONP-style callback injection)                                                                                                                                                 |
| `sanitizeCSSColor` / `sanitizeCSSNumber` | Style values                                                  | Regex/range validation with a safe fallback — never passes an unvalidated value into a `<style>` block                                                                                                                                                                                |

`js/preview.js`'s `sanitizePreviewConfig(config, componentId)` is the single call site that applies the correct sanitizer to every field of a component's configuration, keyed by field semantics (rich text vs. URL vs. color vs. numeric), immediately before compilation (`docs/ARCHITECTURE.md` §4). **No generator — registered or legacy — should interpolate a config value into HTML/CSS/JS output without it having passed through `sanitizePreviewConfig` first.**

## Uploaded file safety (`js/media.js`)

- **Extension/MIME allowlist**: every upload kind (`image`, `audio`, `video`, `captions`) has a fixed map of accepted extensions to accepted MIME types; anything else is rejected.
- **Byte-signature verification** (`hasExpectedFileSignature`): after the extension/MIME check, the file's actual leading bytes (magic numbers) are checked against the declared type — JPEG/PNG/GIF/WebP/WAV/MP3/MP4/WebM signatures, and a `WEBVTT` text-prefix check for captions. This catches a renamed/mislabeled file before it is trusted.
- **SVG is never trusted as an image and passed through** — it is parsed as text and rejected wholesale (not lossily repaired) if it contains any of: `<!DOCTYPE`/`<!ENTITY`, `<script>`/`<foreignObject>`/`<iframe>`/`<object>`/`<embed>`/`<audio>`/`<video>`/`<canvas>`, any `on*=` event-handler attribute, `javascript:`/`vbscript:` URLs, `data:text/html`, external `href`/`xlink:href`/`src` references, or external `@import`/`url()` style references. Only a passing SVG is stored, as a plain-text `Blob`.
- **Size limits** are configurable per media kind in Builder Settings, clamped to a safe bounded range (`MEDIA_LIMIT_BOUNDS_MB` in `js/storage.js`) so an author cannot configure an effectively unlimited upload size.

## Persisted-data integrity (`js/storage.js`, `js/themes.js`)

- `validateProject()` and `validateTheme()` are the only paths by which a stored or imported value becomes part of `appState`. Both reject anything that doesn't match their exact expected shape (required fields, string patterns for colors/ids, enum membership for shadow/font/density values) rather than coercing unknown shapes best-effort.
- `isSafeProjectValue()` additionally allowlists project-JSON key names (`/^[a-zA-Z0-9_-]+$/`), rejects any `objectUrl`/`blob` property outright, and bounds nesting depth (12), array length (1000), and object key count (100) per level — a defense against pathological or malicious imported JSON (prototype-pollution-shaped payloads, oversized documents) rather than just malformed ones.
- Media references embedded in project config are structurally validated by `isMediaReference()` (`js/media.js`) as part of the same check — a reference-shaped object must have the exact expected key types, or it's rejected.

## Generated-document sandbox (`docs/EXPORT-CONTRACT.md`)

Every compiled document — preview, popout, and every export format — carries the same Content-Security-Policy:

```
default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com data:; img-src 'self' http: https: data: blob:;
media-src 'self' http: https: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'
```

Key properties:

- **`connect-src 'none'`** — a generated component can never make a network request of its own (no exfiltration channel), regardless of what content an author puts into it.
- **`script-src 'unsafe-inline'`** is required because the compiler always emits its own inline `<script>` and never loads an external script file. This is a real, bounded trade-off: it means the CSP cannot block _the app's own_ inline script (there is no alternative — no external script is ever referenced), but it does nothing to relax the sanitization contract above, which is what actually prevents _author content_ from becoming script.
- The live-preview iframe (`iframe.srcdoc`) uses `sandbox="allow-scripts allow-same-origin"`. **This combination is the one place a hypothetical sanitizer bug would have the most consequence** — `allow-same-origin` means a script that did escape sanitization would run in a context with iframe-same-origin privileges relative to the parent page, not a fully isolated origin. This is accepted as a bounded risk today because (a) it's required for current preview interactivity, and (b) nothing in the compiler ever passes unsanitized content into the document — but it means the sanitization contract above is not merely defense-in-depth, it is the primary control. Any future change to a generator must be reviewed with this in mind.
- The exported iframe embed snippet additionally allows `allow-popups allow-popups-to-escape-sandbox allow-forms`, needed for legitimate component behavior (e.g. opening an external resource link, submitting a form-shaped interaction) in the _host_ page's context.
- `js/preview.js`'s `openPreview()` sets `previewWindow.opener = null` before writing to the popped-out window — the standard mitigation against reverse-tabnabbing via `window.open()`.

## Rise/LMS message safety

The one outbound message (`docs/ARCHITECTURE.md` §11) uses a wildcard target origin (`postMessage(..., '*')`). The payload is a fixed, non-sensitive completion signal (`{ type: 'RISE_BLOCK_COMPLETE', status: 'completed' }`) with no author-controlled or learner-identifying data, so the wildcard origin is a low-severity, accepted trade-off (the component doesn't know its host's origin in advance) rather than an oversight. If a future message ever carries anything more sensitive, it must target a specific origin, not `'*'`.

## Known residual risks

- **`allow-same-origin` + `allow-scripts`** on the preview iframe (above) — accepted, contingent on sanitizer correctness, not actively exploitable today.
- **No Subresource Integrity (SRI)** on the Google Fonts `<link>` tags in the builder shell or generated output — low severity, same trust tier as any other external asset the app already depends on, but worth closing if the app ever tightens its external-dependency posture.
- **Dev-tooling dependency advisory**: `npm audit` reports a high-severity advisory in `brace-expansion` (a transitive dependency of ESLint 9's own `minimatch`/`@eslint/config-array` chain, added in this phase). It is a ReDoS risk in glob-pattern matching, exercised only against this repository's own trusted lint-target globs at dev/CI time — it never processes untrusted input and ships in zero production code (`npm audit --omit=dev` reports 0 vulnerabilities). Upgrading to ESLint 10 would resolve it but is a breaking major-version change deferred to a future phase per `docs/KNOWN-ISSUES.md`.
- **No server-side or automated malware scanning of uploads** — file-signature checks (above) catch mismatched/spoofed types, not malicious payloads disguised as valid files of the correct type. This is an accepted limitation of a browser-only, no-backend tool.

## What this document does not cover

Accessibility-specific risk (advisory vs. blocking alt-text/caption warnings) is covered in `docs/ARCHITECTURE.md` §7 and `docs/KNOWN-ISSUES.md`, not here, since it is a correctness/inclusion concern rather than a confidentiality/integrity/availability one.
