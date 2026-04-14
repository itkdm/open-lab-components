# Event Protocol (v1)

This document defines the shared event contract for interactive components so host applications can observe and respond to component state changes in a consistent way.

---

## 1. Design Principles

- **minimal intrusion**
  Events complement CSS variables and `data-props`. They do not replace them.
- **uniform interface**
  Interactive components share the same event names and `detail` shape.
- **optional adoption**
  Hosts may use the event layer or continue to rely on other observation mechanisms.
- **bubbling propagation**
  Events should bubble so hosts can delegate listeners at container or document level.

---

## 2. Event Names

All interactive components use the `cmp:` namespace:

| Event | Trigger timing | Meaning |
|------|------|------|
| `cmp:change` | while interaction is ongoing | continuous updates, similar to `input` |
| `cmp:changeend` | when one interaction ends | final update, similar to `change` |

---

## 3. `detail` Shape

Events use `CustomEvent.detail`:

```js
event.detail = {
  id: "phy.rheostat.slide.interactive",
  type: "slide",
  values: {
    position: 0.72,
    resistance: 36.0
  }
};
```

### 3.1 Fields

| Field | Type | Required | Meaning |
|------|------|------|------|
| `id` | string | yes | the component `data-cmp-id` |
| `type` | string | yes | interaction type |
| `values` | object | yes | observable current state |

### 3.2 Interaction types

| Type | Meaning | Typical components |
|------|------|------|
| `slide` | one-dimensional sliding | rheostats, thermometers, spring scales |
| `drag` | 2D dragging | probes, draggable tools, connectors |
| `rotate` | rotation | protractors and rotatable instruments |
| `toggle` | binary switching | timers, switches |
| `adjust` | multi-parameter adjustment | levers, pulley systems |

### 3.3 `values`

- keys should align with the manifest `props` keys when possible
- numeric values should match the declared prop domains
- derived values may also be included if they help the host directly
- keep a reasonable numeric precision

---

## 4. Emitting Events

### 4.1 Standard helpers

```js
function emitChange(root, type, values) {
  root.dispatchEvent(new CustomEvent("cmp:change", {
    bubbles: true,
    composed: true,
    detail: {
      id: root.getAttribute("data-cmp-id"),
      type,
      values
    }
  }));
}

function emitChangeEnd(root, type, values) {
  root.dispatchEvent(new CustomEvent("cmp:changeend", {
    bubbles: true,
    composed: true,
    detail: {
      id: root.getAttribute("data-cmp-id"),
      type,
      values
    }
  }));
}
```

### 4.2 Trigger timing

- emit `cmp:change` for each meaningful update during interaction
- emit `cmp:changeend` once when interaction ends
- for `toggle`, `cmp:change` is often enough because the transition is instantaneous

### 4.3 Performance

- `cmp:change` may fire frequently
- hosts may debounce or throttle if needed
- components should prefer immediate correctness over internal throttling

---

## 5. Manifest Extension

Interactive components should declare `events` in the manifest, for example:

```json
{
  "events": [
    {
      "name": "cmp:change",
      "type": "slide",
      "values": {
        "position": "number(0-1)",
        "resistance": "number(ohm)"
      }
    }
  ]
}
```

This field is recommended metadata so hosts and developers can discover supported events from the manifest itself.

---

## 6. Host Listening Examples

### 6.1 Direct listener

```js
const rheostat = document.querySelector('[data-cmp-id="phy.rheostat.slide.interactive"]');

rheostat.addEventListener("cmp:change", (e) => {
  console.log("resistance update:", e.detail.values.resistance);
});

rheostat.addEventListener("cmp:changeend", (e) => {
  console.log("adjustment finished:", e.detail.values.resistance);
});
```

### 6.2 Delegated listener

```js
document.addEventListener("cmp:change", (e) => {
  const { id, type, values } = e.detail;
  console.log(`[${id}] ${type}:`, values);
});
```

### 6.3 React

```jsx
useEffect(() => {
  const el = containerRef.current?.querySelector(".cmp");
  if (!el) return;

  const handler = (e) => {
    setState(e.detail.values);
  };

  el.addEventListener("cmp:change", handler);
  return () => el.removeEventListener("cmp:change", handler);
}, []);
```

### 6.4 Vue

```js
onMounted(() => {
  const el = container.value?.querySelector(".cmp");
  el?.addEventListener("cmp:change", (e) => {
    state.value = e.detail.values;
  });
});
```

---

## 7. Typical Component Event Fields

| Component ID | Type | Typical values |
|------|------|------|
| `phy.rheostat.slide.interactive` | `slide` | `position`, `resistance` |
| `phy.apparatus.thermometer.interactive` | `slide` | `temperature` |
| `phy.apparatus.spring-scale.interactive` | `slide` | `force` |
| `phy.apparatus.protractor.interactive` | `rotate` / `drag` | `angle`, `x`, `y` |
| `phy.mechanics.lever.interactive` | `adjust` | `l1`, `l2`, `torque1`, `torque2`, `balanced` |
| `phy.apparatus.timer.interactive` | `toggle` | `running`, `elapsed` |

---

## 8. Versioning

- This protocol is v1 and aligns with `cmp-manifest/v1`
- It is designed as an additive contract
- future extensions can introduce richer sync semantics in a later version
