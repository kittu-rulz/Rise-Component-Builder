# Component schema

## Current project configuration model

Projects persist a `config` object with shared component configuration plus component-specific item data:

```js
{
  blockTitle,
  blockHeadline,
  blockDesc,
  colorPrimary,
  colorAccent,
  colorBg,
  colorText,
  borderRadius,
  shadowDepth,
  borderOutline,
  accordionMulti,
  accordionAnimation,
  iconStyle,
  trackCompletion,
  completionMsg,
  themeTokens,
  items: []
}
```

Item fields are driven by `js/editor-schemas.js`. A field definition can contain `id`, `label`, `type`, `default`, `required`, `requiredOne`, `groupAcrossItems`, `min`, `max`, `step`, `suffix`, `maxLength`, `pattern`, `patternMessage`, and `options`.

## Shared configuration properties

| Property | Type | Purpose |
|---|---:|---|
| `blockTitle` | string | Eyebrow/category label |
| `blockHeadline` | string | Main generated heading |
| `blockDesc` | string | Learner instructions or introduction |
| `items` | array | Ordered component-specific authoring records |

## Theme and style properties

| Property | Type | Current values |
|---|---:|---|
| `colorPrimary` | hex string | Six-digit color |
| `colorAccent` | hex string | Six-digit color |
| `colorBg` | hex string | Six-digit color |
| `colorText` | hex string | Six-digit color |
| `borderRadius` | numeric string | Legacy resolved value, 0–32 |
| `shadowDepth` | string | `none`, `soft`, `medium`, `premium` |
| `borderOutline` | boolean | Show/hide component borders |
| `iconStyle` | string | `chevron`, `plus-minus`, `arrow` |

These properties remain for generator compatibility and are synchronized from the active theme plus component overrides. `themeTokens` contains the resolved exported-component tokens. The builder UI mode and legacy application setting `settings.defaultFont` are separate from the exported component theme.

## Theme model

Projects store a validated theme snapshot with `schemaVersion: 1`, identity and lock metadata, timestamps, and these tokens:

```text
fontFamily, headingFontFamily, primary, primaryHover, accent,
background, surface, text, mutedText, border, success, warning,
danger, borderRadius, buttonRadius, shadow, spacingDensity,
animationSpeed
```

Supported fonts are Merriweather, Lato, Roboto, Montserrat, and Open Sans. Shadows are `none`, `soft`, `medium`, or `premium`; spacing is `compact`, `comfortable`, or `spacious`; radii are integers from 0–32 and animation speed is an integer from 0–2000 milliseconds.

`componentOverrides` may contain `primary`, `accent`, `background`, `text`, `borderRadius`, `shadow`, and `fontFamily`. Missing keys inherit the active theme. Resetting overrides removes these keys rather than copying theme values into them.

## Behavior properties

| Property | Type | Purpose |
|---|---:|---|
| `accordionMulti` | boolean | Allows multiple accordion panels to remain open |
| `accordionAnimation` | boolean | Records author preference for accordion animation |
| `iconStyle` | string | Selects accordion indicator presentation |

Some interaction behavior is currently fixed in `js/preview.js` rather than represented in configuration.

## Completion tracking

| Property | Type | Purpose |
|---|---:|---|
| `trackCompletion` | boolean | Enables generated progress tracking |
| `completionMsg` | string | Screen-reader completion announcement |

The preview runtime calculates trackable counts per component. Content-reveal components generally complete after all items are viewed; assessments complete on success; media completes on the `ended` event.

## Current item structures by component

| Component ID | Item fields currently authored |
|---|---|
| `accordion` | `title`, `content` |
| `tab-blocks` | `title`, `content` |
| `flip-cards` | `title`, `content`; consecutive entries form front/back pairs |
| `hotspots` | `title`, `content`, `x`, `y` |
| `button-list` | `title`, `content` (destination URL) |
| `menu-list` | `title`, `content` |
| `multiple-choice` | `label`, `content` (feedback), `correct` |
| `sorting-activity` | `title`, `content`, `category` |
| `fill-blank` | `title` containing `[blank]`, `content` (accepted answer) |
| `vertical-timeline` | `title`, `content` |
| `horizontal-timeline` | `title`, `content` |
| `process-flow` | `title`, `content`, `durationMinutes` |
| `scenario` | `title`, `content`; first item acts as prompt and later items as choices |
| `profile-cards` | `title`, `content`, `image`, `altText`, `decorative`, `imageCrop` |
| `info-grid` | `title`, `content`, `accentColor` |
| `pricing-comparison` | `title`, `content`, `highlighted`, `actionUrl` |
| `audio-player` | `title`, `content` (audio source), `contentDuration`, `transcript` |
| `video-frame` | `title`, `content` (video source), `posterImage`, `posterAltText`, `posterDecorative`, `captionsUrl`, `transcript`, `audioDescription` |
| `image-gallery` | `content` (image source), `title`, `caption`, `altText`, `decorative`, `imageFit` |
| `ai-generator` | `title`, `content` (prompt) |
| `ai-quiz-maker` | `title`, `content` (prompt) |

Rich text is supported for selected content fields and sanitized to an allowlist before rendering.

Hotspots additionally use component-level fields: `backgroundImage`, `backgroundAltText`, `backgroundDecorative`, `backgroundFit`, `backgroundFocalX`, and `backgroundFocalY`.

## Media reference model

External media remains a validated HTTP(S) URL string. A local upload is represented in configuration as JSON-safe metadata:

```js
{
  source: 'upload',
  mediaId,
  schemaVersion,
  kind,
  name,
  mimeType,
  size,
  createdAt,
  duration
}
```

The corresponding IndexedDB record additionally contains the Blob and editable metadata fields. Object URLs are created only at runtime and are not part of the schema.

## Component module contract

The five modular components currently export:

```text
id
name
category
defaultConfig
editorSchema
generateHTML(config)
generateCSS(config)
generateJS(config)
validate(config)
```

The legacy component branches do not yet expose this contract independently.

The automated generator contract suite exercises all five modular components with empty, one-item, many-item, long-text, emoji, multilingual, right-to-left, quote, closing-script, and unsafe-URL fixtures. It parses generated HTML, checks ID uniqueness within an instance, parses CSS, compiles JavaScript, and rejects accidental `undefined` or object-string output.

## Recommended schema improvements

The following are recommendations, not descriptions of current behavior:

- Add stable item IDs so media ownership and reordering do not depend on array position.
- Add component-level schema sections in addition to `itemFields`, especially for hotspot backgrounds.
- Add conditional schema visibility so decorative images can hide or disable alternative-text inputs.
- Separate warnings from blocking validation errors.
- Add schema migrations per component when new fields are introduced.
- Complete modularization so every generator owns its defaults, schema, validation, and output.
