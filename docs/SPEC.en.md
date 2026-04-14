# Component Spec (v1)

This document defines the structural, styling, configuration, and quality requirements for a single component HTML fragment in this repository.

Any pull request that violates the required constraints in this spec should be rejected by review or CI.

---

## 0. Goal

This spec exists to keep the component catalog:

- small and reusable at the single-component level
- visually configurable through a consistent mechanism
- easy to compose into larger host pages and teaching workflows

A component file is only responsible for:

- what the teaching object looks like
- which parameters are configurable
- how those parameters map onto visuals

It is not responsible for page layout, page background, typography, or host-facing explanatory copy.

---

## 1. Scope and Terms

- **component file**
  A single `.html` file under `components/**`
- **HTML fragment**
  A fragment that does not include `<!doctype html>`, `<html>`, `<head>`, or `<body>`
- **manifest**
  The `<!-- @cmp-manifest ... -->` JSON block at the top of the file
- **host**
  The final application, editor, or page that embeds the component

---

## 2. File and Output Shape

### 2.1 MUST

1. A component file must be an HTML fragment.
2. One component file defines exactly one component.
3. A component file must contain exactly one root node.

### 2.2 MUST NOT

1. Do not output a full HTML document structure such as `<!doctype html>`, `<html>`, `<head>`, or `<body>`.
2. Do not import external CSS, JS, fonts, or image URLs.
3. Do not depend on host global styles for correct rendering.

---

## 3. Manifest

### 3.1 Location and format

- The manifest must appear at the top of the file.
- It must use the `<!-- @cmp-manifest ... -->` wrapper.
- The JSON must be valid strict JSON.

### 3.2 Top-level fields

Required or recommended fields in `cmp-manifest/v1`:

- `schema`
  Required. Fixed to `"cmp-manifest/v1"`
- `id`
  Required. Globally unique, for example `phy.resistor.axial.basic`
- `name`
  Required. Chinese display name
- `nameEn`
  Recommended. English display name
- `category`
  Required. `subject/domain`, for example `physics/circuit`
- `version`
  Required. SemVer such as `1.0.0`
- `viewport`
  Recommended. Default preview box such as `{ "w": 64, "h": 64 }`
- `tags`
  Recommended. Search and filtering tags
- `props`
  Recommended. Configurable prop declarations
- `cssVars`
  Recommended. Mapping from props to CSS custom properties

### 3.3 `props` and `cssVars`

Recommended fields for each `props` item:

- `key`
- `type`
- `default`
- optional `min` / `max`
- `desc`

`cssVars` maps a prop key to the corresponding CSS variable name, for example:

```json
{
  "size": "--cmp-size",
  "stroke": "--cmp-stroke",
  "glow": "--cmp-glow"
}
```

### 3.4 Example

```html
<!-- @cmp-manifest
{
  "schema": "cmp-manifest/v1",
  "id": "phy.meter.voltage.draggable",
  "name": "Voltage Meter (Draggable)",
  "category": "physics/circuit",
  "version": "1.0.0",
  "viewport": { "w": 120, "h": 120 },
  "tags": ["voltmeter", "meter", "circuit", "draggable"],
  "props": [
    { "key": "size", "type": "number(px)", "default": 120, "min": 48, "max": 360, "desc": "Component size." }
  ],
  "cssVars": {
    "size": "--cmp-size"
  }
}
-->
```

---

## 4. DOM Contract

The component root node must satisfy:

- `class="cmp"`
- `data-cmp-id="..."` exactly equal to `manifest.id`
- `role="img"`
- `aria-label="..."`

Example:

```html
<div class="cmp" data-cmp-id="phy.resistor.axial.basic" role="img" aria-label="Axial resistor">
  <!-- svg / div structure -->
</div>
```

---

## 5. Style Contract

### 5.1 MUST

1. Styles must be inline in the component file via `<style>`.
2. All selectors must be scoped by the component root.
   Recommended shape: `.cmp[data-cmp-id="..."] ...`
3. Visual parameters must be overridable through CSS variables.

### 5.2 MUST NOT

1. Do not use global selectors such as `html`, `body`, `:root`, or bare `*` unless they are fully scoped under the component root.
2. Do not set host page background, page font, page layout, or other non-component concerns.

### 5.3 Recommended shared CSS variables

- `--cmp-size`
- `--cmp-stroke`
- `--cmp-stroke-width`
- `--cmp-accent`
- `--cmp-glow`
- `--cmp-shadow`

Requirements:

- always use `var(--token, fallback)`
- allow the host to override values from inline style or ancestor scopes

---

## 6. JavaScript Contract

### 6.1 Default rule

- If CSS and HTML are enough, do not use JS.

### 6.2 JS is allowed only when all of the following are true

1. The component genuinely needs interaction.
2. The script is fully self-contained, typically inside an IIFE.
3. The script only queries or mutates DOM inside its own component root.
4. The script does not make network requests or read/write host-sensitive data.

### 6.3 Interaction events

Interactive components should use `CustomEvent` to notify the host. See [EVENT.md](./EVENT.md).

- `cmp:change`
- `cmp:changeend`
- use `bubbles: true` and `composed: true`
- `detail` should follow `{ id, type, values }`
- the manifest should declare supported events in `events`

Recommended shape:

```html
<script>
(() => {
  const root = document.currentScript?.previousElementSibling;
  if (!root) return;
  // only operate inside root
})();
</script>
```

---

## 7. Accessibility

- The root should provide `role="img"` and `aria-label`.
- Important interactive controls should expose reasonable `aria-*` metadata when applicable.

---

## 8. Quality Checklist

Before opening a PR, verify:

- [ ] The file is an HTML fragment.
- [ ] The component has exactly one root node.
- [ ] The root includes `class="cmp"`, `data-cmp-id`, `role`, and `aria-label`.
- [ ] The manifest exists and is valid JSON.
- [ ] `manifest.id` matches `data-cmp-id`.
- [ ] There are no external resources.
- [ ] CSS is properly scoped.
- [ ] Configurable values are exposed through CSS variables with fallbacks.
- [ ] Any JS is self-contained and does not leak globals or make network requests.

---

## 9. Versioning and Compatibility

- In v1, `schema` is fixed to `cmp-manifest/v1`.
- Breaking manifest changes must bump the schema version and ship migration notes in `docs/`.

---

## 10. Localization (`cmp-manifest/v2`)

`cmp-manifest/v2` adds machine-readable locale metadata without changing the DOM contract.

- language-neutral fields remain at the top level
- locale-specific fields move into `locales[locale]`
- default locale is `zh-CN`
- hosts and tools should fall back field-by-field to `zh-CN`
- legacy `cmp-manifest/v1` remains readable during migration
