# Runtime Helpers

This document describes the minimal runtime lifecycle added on top of the existing `v1` component format.

## Public API

```js
const lab = require('@itkdm/open-lab-components');

lab.mount(html, container, props);
lab.updateProps(container, nextProps);
lab.unmount(container);
```

## Behavior

- `mount(html, container, props)` inserts the component HTML, re-activates inline scripts, and writes `data-props` onto the mounted `.cmp` root.
- `updateProps(container, props)` updates `data-props` on the mounted `.cmp` root. Components that already observe `data-props` continue to work unchanged.
- `unmount(container)` runs any cleanup callback registered by the mounted component and then clears the container DOM.

## Cleanup registration

Migrated interactive components can register cleanup through the mounted root:

```js
const registerCleanup =
  typeof root.__olcRegisterCleanup === 'function'
    ? root.__olcRegisterCleanup.bind(root)
    : null;

if (registerCleanup) {
  registerCleanup(() => {
    observer.disconnect();
    clearInterval(timer);
    cancelAnimationFrame(frameId);
  });
}
```

## Registry alignment

If a component manifest declares `events`, the same `events` payload is preserved in `registry/registry.json`. The registry is now the recommended source for event discovery in hosts, demo tooling, and inspectors.
