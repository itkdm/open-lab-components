# Project Rules

## Identity

Open Lab Components is a zero-dependency HTML fragment component library for STEM education.

The stable core is:

- `components/**/*.html` as the source of truth
- `tools/build-registry/index.js` to extract manifests into registry data
- `tools/validate/index.js` to enforce component rules
- `index.js` and `index.d.ts` as the public API
- `site/` pages as registry consumers

## Component File Shape

Each component should usually contain:

1. Top-of-file manifest comment
2. One `.cmp` root with `data-cmp-id`
3. Local `<style>`
4. Optional inline `<script>`

Keep the component self-contained. Avoid external fetches, framework bindings, or shared global CSS.

## Manifest Expectations

Keep `cmp-manifest/v1`.

Common fields:

- `schema`
- `id`
- `name`
- `nameEn`
- `category`
- `version`
- `viewport`
- `tags`
- `props`
- `cssVars`
- `events` when applicable

If the component emits structured events, declare `events` so they reach the registry and site.

## Interactive Cleanup

Preferred pattern:

```js
var registerCleanup = typeof root.__olcRegisterCleanup === 'function'
  ? root.__olcRegisterCleanup.bind(root)
  : null;

function cleanup() {
  // disconnect observers
  // cancel animation frames
  // clear timers
  // remove global listeners
}

if (registerCleanup) registerCleanup(cleanup);
```

Use this especially for:

- `MutationObserver`
- `requestAnimationFrame`
- `setTimeout` and `setInterval`
- `document.addEventListener(...)`
- `window.addEventListener(...)`

## Public API

Current important public entry points:

- `list`
- `get`
- `categories`
- `readSync`
- `read`
- `resolve`
- `mount`
- `unmount`
- `updateProps`
- `registry`

Preserve compatibility unless the user explicitly requests a breaking change.

## High-Risk Areas

Be careful when editing:

- `index.js`
- `index.d.ts`
- `tools/build-registry/index.js`
- `tools/validate/index.js`
- `site/components.html`
- `site/playground.html`

Changes in these files usually require full validation.
