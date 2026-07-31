# Testing strategy

This document explains _why_ the test suite is shaped the way it is and defines the commands introduced in this phase. For step-by-step "how do I run/debug a test" instructions, see the root `TESTING.md`, which remains the practical how-to guide and is unchanged by this phase except for the new command table below.

## The pyramid

```
        ▲  Playwright e2e (tests/e2e/*.spec.js)
        │  Real browsers × 3 engines, full user flows, axe-core a11y scans
        │  Slow, highest confidence for "does this work for a user"
        │
        │  Vitest integration/generator tests (tests/*.test.mjs, tests/unit)
        │  jsdom where needed, hostile-input fixtures, generated-output parsing
        │  Fast, highest confidence for "does this module do the right thing"
        │
        ▼  Static analysis (eslint, tsc --checkJs)
           Fastest, catches syntax/type/style errors before a test even runs
```

Each layer exists to catch a different class of regression as cheaply as possible. Static analysis is new in this phase and sits below the test layers deliberately — it should fail fast, before either test runner spends time on a file that has an obvious defect.

## Commands

| Command                 | Layer            | Purpose                                                                                                                        |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run lint`          | Static analysis  | ESLint over `app.js`, `js/`, `components/`, `tests/`, `build.mjs`, `eslint.config.js`                                          |
| `npm run format`        | Static analysis  | Prettier, writes formatting fixes                                                                                              |
| `npm run format:check`  | Static analysis  | Prettier, fails if any file is unformatted (CI-safe, no writes)                                                                |
| `npm run typecheck`     | Static analysis  | `tsc --noEmit` against the existing `.js` files via JSDoc types (`checkJs`), incrementally adopted — see "Type checking" below |
| `npm run test:unit`     | Unit/integration | `vitest run` — all Vitest suites once                                                                                          |
| `npm run test:watch`    | Unit/integration | `vitest` in watch mode, for local development                                                                                  |
| `npm run test:coverage` | Unit/integration | `vitest run --coverage`, enforcing the existing 70/60/70/70 thresholds                                                         |
| `npm run test:e2e`      | E2E              | `playwright test` — Chromium, Firefox, WebKit                                                                                  |
| `npm run test:e2e:ui`   | E2E              | Playwright's interactive UI                                                                                                    |
| `npm run build`         | Build            | `build.mjs` — assembles and verifies the static `dist/` tree (`docs/ARCHITECTURE.md`, "Build")                                 |
| `npm run validate`      | Composite        | `lint && typecheck && test:coverage && build`, in that order — the single CI-friendly gate described below                     |

`npm run validate` intentionally does **not** include `format:check`. Prettier was introduced in this phase with a config matched as closely as possible to the codebase's existing style (single quotes, semicolons, no trailing commas), but running it once across ~45 pre-existing files would produce a large, purely cosmetic diff unrelated to this phase's architectural goal ("avoid rewriting the entire application"). `npm run format`/`format:check` are available now for new and touched files, and a dedicated one-time repo-wide formatting commit is recommended as a follow-up (`docs/KNOWN-ISSUES.md`) so it can be reviewed and attributed on its own, not buried inside a behavioral or architectural change.

`npm run validate` also intentionally does **not** include `test:e2e`. Playwright's full three-browser run takes several minutes and, per `docs/KNOWN-ISSUES.md`, currently has an environment-dependent Firefox flake — bundling it into the fast local/CI gate would make `validate` unreliable for its actual purpose (a quick "is this change safe" check). `test:e2e` remains a separate, explicit step in CI (`.github/workflows/tests.yml`) and before any release.

## Type checking

TypeScript is **not** used as a compile target — the application still ships as plain `.js` ES modules with no build/transpile step (`docs/ARCHITECTURE.md`). What this phase adds is `tsc --noEmit` running in `checkJs` mode against a `tsconfig.json` with `allowJs: true`, which type-checks the _existing_ JavaScript using its natural JSDoc comments and inferred types, without requiring a single file to be renamed or rewritten. This is the standard "incremental adoption" path for a JS codebase not otherwise using TypeScript.

One file, `app.js`, is opted out with `// @ts-nocheck`: its first type-checking pass surfaced roughly 80 errors, nearly all of the same shape — `document.getElementById(...)` returning the generic `Element`/`HTMLElement` type, so a later `.value`/`.checked`/`.style`/`.files` access on ~40 different element references reads as a type error even though it is correct at runtime. Fixing this properly means adding a JSDoc element-type cast at each of those ~40 call sites — real, mechanical work, but disproportionate to this phase's scope ("fix only issues directly related to this phase," "avoid rewriting the entire application"). It is deferred as a deliberate, visible opt-out (not a silent gap) — see "Deferred work" below.

Every other file — including `js/preview.js`, despite its size and dynamic `componentId` branching — type-checks cleanly today with zero errors, because its logic is largely string/object transformation rather than direct, untyped DOM element access. `js/storage.js`, `js/themes.js`, `js/editor.js`, and `js/media-upload.js` needed a small number of added `@param` JSDoc annotations (documenting existing, correct parameter shapes — no behavior changes) to resolve structural-typing false positives from destructured-parameter inference; those are now clean and enforced going forward. As `app.js`'s DOM wiring is incrementally typed or migrated into the component registry (`docs/ARCHITECTURE.md` §1, `docs/KNOWN-ISSUES.md`), its `@ts-nocheck` should be dropped.

## E2E browser matrix and known flake

Playwright drives three engines (`playwright.config.js`): Chromium, Firefox, and desktop WebKit, against `tests/e2e/server.mjs`, a dependency-free local static server — no hosted environment is required.

**Current status (last verified during the production-readiness audit, `docs/PRODUCTION-READINESS-AUDIT.md`):** Chromium and WebKit pass their full suites. In this sandboxed execution environment, the `firefox` project fails 12 tests, all with `Test timeout of 30000ms exceeded` during `page.goto('/')` or Playwright's page setup — i.e. Firefox never finished loading the local test server within 30 seconds. This has the signature of an environment/sandbox launch-latency issue rather than an application defect (nothing in the failures references application code or assertions — they never get past navigation), but it has **not yet been confirmed against an unrestricted environment** (e.g. the project's own GitHub Actions runner). Treat it as an open item, not a dismissed one, until re-verified there. See `docs/KNOWN-ISSUES.md`.

One test is permanently skipped on WebKit (`flip-card custom artwork uploads per face and removal restores the built-in icon`): Playwright's bundled WebKit build on Windows cannot store a `Blob` in IndexedDB at all in this environment, reproduced with zero application code (`indexedDB.open(...).put({ blob })` fails outright). This is a documented Playwright/WebKit-on-Windows limitation, not an app defect — real Safari is unaffected.

Firefox and WebKit don't support Playwright's `clipboard-read`/`clipboard-write` permission grants (Chromium-only CDP permission). The export copy-to-clipboard test verifies the visible success state (button text/class, toast) on all three engines but only reads back actual clipboard contents on Chromium.

## Coverage scope

V8 coverage gates (`vitest.config.js`) apply only to `js/state.js`, `js/storage.js`, `js/themes.js`, `js/utilities.js`, and `components/*.js` — the leaf/near-leaf modules with the highest correctness stakes and the most tractable input space (`docs/ARCHITECTURE.md`, "Important dependencies"). `js/preview.js` and `app.js` are exercised through integration and E2E tests, not folded into the unit coverage percentage, because their current unmodularized size and DOM-orchestration nature make line coverage a poor correctness signal for them — this will change as they're incrementally split per `docs/KNOWN-ISSUES.md`.

## Test folder structure

```text
tests/
├── fixtures/                 Reusable project, theme, content, URL, and storage fixtures
├── setup/                    Shared Vitest cleanup
├── unit/                     Utility, state, persistence, and generator tests
├── e2e/
│   ├── server.mjs            Dependency-free local static server
│   ├── application.spec.js   Shell, catalog, mode, and responsive tests
│   ├── editor-preview.spec.js
│   ├── interactions.spec.js
│   ├── persistence-export.spec.js
│   └── accessibility.spec.js
├── accessibility.test.mjs    Generated-output accessibility integration tests
├── media.test.mjs            Media validation/storage/export tests
├── security.test.mjs         Hostile-input and interpolation tests
└── themes.test.mjs           Theme model and persistence tests
```

## What's missing (see `docs/KNOWN-ISSUES.md` for the full list)

- No automated tests exercise the 15 unregistered legacy components at the same hostile-input-fixture depth as the 6 registered ones.
- No visual regression/pixel-diff snapshots (a deliberate choice, not an oversight — see `TESTING.md`).
- No fuzz/property-based testing beyond the fixed hostile-input cases already present.
- `npm run test:e2e` is not yet part of `npm run validate` (by design, above) or confirmed green for Firefox in an unrestricted environment.
