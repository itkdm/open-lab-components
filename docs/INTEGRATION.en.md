# Integration Guide

This guide is for consumers who want to embed, configure, and control Open Lab Components in their own projects.

---

## 1. Getting Components

### Option A: copy component files directly

Copy the required `.html` files from `components/` into your own project. Each file is a self-contained HTML fragment with no external runtime dependency.

### Option B: load by registry

`registry/registry.json` contains metadata and source paths for all components and can be used for dynamic discovery:

```js
const registry = await fetch("/path/to/registry.json").then((r) => r.json());
const beaker = registry.items.find((c) => c.id === "chem.labware.beaker.graduated.basic");
// beaker.sourcePath -> "components/chemistry/labware/chem.labware.beaker.graduated.basic.html"
```

---

## 2. Embedding in Plain HTML

### 2.1 Inline

Paste the component content directly into your page:

```html
<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic" role="img" aria-label="Light bulb">
  <!-- component content -->
</div>
<style>
  .cmp[data-cmp-id="phy.apparatus.bulb.basic"] { /* ... */ }
</style>
```

### 2.2 Dynamic loading

```html
<div id="container"></div>

<script>
async function loadComponent(container) {
  const resp = await fetch("/components/physics/apparatus/phy.apparatus.bulb.basic.html");
  const html = await resp.text();
  container.innerHTML = html;

  container.querySelectorAll("script").forEach((oldScript) => {
    const newScript = document.createElement("script");
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

loadComponent(document.getElementById("container"));
</script>
```

`innerHTML` does not execute embedded `<script>` tags automatically, so you need to recreate them.

---

## 3. React Integration

### 3.1 Basic wrapper

```jsx
import { useEffect, useRef } from "react";

function LabComponent({ html, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = html;

    el.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });

    return () => {
      el.innerHTML = "";
    };
  }, [html]);

  useEffect(() => {
    const cmp = containerRef.current?.querySelector(".cmp");
    if (!cmp || !style) return;
    Object.entries(style).forEach(([key, value]) => {
      cmp.style.setProperty(key, String(value));
    });
  }, [style]);

  return <div ref={containerRef} />;
}
```

### 3.2 Example

```jsx
<LabComponent
  html={html}
  style={{
    "--cmp-size": "120px",
    "--cmp-glow": "0.8",
    "--cmp-accent": "#ffcc00"
  }}
/>
```

---

## 4. Vue Integration

### 4.1 Basic wrapper

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

const props = defineProps({
  html: { type: String, required: true },
  vars: { type: Object, default: () => ({}) }
});

const container = ref(null);

function render() {
  const el = container.value;
  if (!el || !props.html) return;
  el.innerHTML = props.html;

  el.querySelectorAll("script").forEach((oldScript) => {
    const newScript = document.createElement("script");
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });

  applyVars();
}

function applyVars() {
  const cmp = container.value?.querySelector(".cmp");
  if (!cmp) return;
  Object.entries(props.vars).forEach(([key, value]) => {
    cmp.style.setProperty(key, String(value));
  });
}

watch(() => props.html, render);
watch(() => props.vars, applyVars, { deep: true });
onMounted(render);
onUnmounted(() => {
  if (container.value) container.value.innerHTML = "";
});
</script>
```

---

## 5. Passing Parameters via CSS Variables

CSS variables are the main configuration mechanism. Each component manifest exposes the supported props and `cssVars`.

### 5.1 Inspect supported variables

```json
{
  "props": [
    { "key": "size", "type": "number(px)", "default": 120, "desc": "Component size" },
    { "key": "glow", "type": "number(0-1)", "default": 0, "desc": "Glow intensity" }
  ],
  "cssVars": {
    "size": "--cmp-size",
    "glow": "--cmp-glow"
  }
}
```

### 5.2 Injection methods

Inline style:

```html
<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"
     style="--cmp-size: 96px; --cmp-glow: 0.8; --cmp-accent: #ffcc00"
     role="img" aria-label="Light bulb">
</div>
```

Ancestor scope:

```html
<div class="experiment-panel" style="--cmp-stroke: #333; --cmp-stroke-width: 2">
  <div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"></div>
</div>
```

JavaScript:

```js
const cmp = document.querySelector('[data-cmp-id="phy.apparatus.bulb.basic"]');
cmp.style.setProperty("--cmp-glow", "0.5");
cmp.style.setProperty("--cmp-accent", "#ff6600");
```

---

## 6. Passing Parameters via `data-props`

Some interactive components support JSON configuration through `data-props`:

```html
<div class="cmp" data-cmp-id="chem.labware.beaker.graduated.basic"
     data-props='{"liquidLevel": 0.6, "scaleMin": 0, "scaleMax": 200, "majorStep": 50}'
     role="img" aria-label="Beaker">
</div>
```

Dynamic update:

```js
beaker.setAttribute("data-props", JSON.stringify({
  liquidLevel: 0.8,
  scaleMin: 0,
  scaleMax: 200,
  majorStep: 50
}));
```

Components that support `data-props` usually use `MutationObserver` internally to react to attribute changes.

---

## 7. Listening for Interaction Events

Interactive components emit standard `CustomEvent` notifications. See [EVENT.en.md](./EVENT.en.md) and [EVENT.md](./EVENT.md).

### 7.1 Event types

| Event | Timing | Meaning |
|------|------|------|
| `cmp:change` | during interaction | continuous updates |
| `cmp:changeend` | when interaction finishes | final update |

### 7.2 Basic listener

```js
const rheostat = document.querySelector('[data-cmp-id="phy.rheostat.slide.interactive"]');

rheostat.addEventListener("cmp:change", (e) => {
  console.log("during slide:", e.detail.values);
});

rheostat.addEventListener("cmp:changeend", (e) => {
  console.log("slide finished:", e.detail.values);
});
```

### 7.3 Delegated listener

```js
document.getElementById("lab-container").addEventListener("cmp:change", (e) => {
  const { id, type, values } = e.detail;
  console.log(`[${id}] ${type}:`, values);
});
```

---

## 8. Multiple Instances on One Page

Components use `data-cmp-id`-scoped CSS, so multiple instances can coexist safely:

```html
<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"
     style="--cmp-size: 80px; --cmp-glow: 0"
     role="img" aria-label="Light bulb off">
</div>

<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"
     style="--cmp-size: 80px; --cmp-glow: 1"
     role="img" aria-label="Light bulb on">
</div>
```

Duplicate `<style>` blocks are usually harmless because the selectors are identical and fully scoped.

---

## 9. FAQ

### The script inside the component did not run

`innerHTML` does not execute `<script>` tags automatically. Recreate the script nodes after insertion.

### CSS variables do not seem to apply

Check:

1. the variable name matches the manifest `cssVars`
2. the variable is applied on the component root or an ancestor
3. the value includes required units such as `px`

### How do I know what a component supports

Read the `@cmp-manifest` block at the top of the file, or inspect `registry.json`.

## Localization

The registry provides both raw multi-locale and localized views:

- `registry/registry.json`
- `registry/registry.zh-CN.json`
- `registry/registry.en.json`

Hosts should prefer the localized registry that matches the current locale and fall back to `zh-CN` where needed.
