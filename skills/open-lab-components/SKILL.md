---
name: open-lab-components
description: Maintain and extend the Open Lab Components HTML fragment component library. Use when working in this repository to add or update components, adjust the runtime, registry, validator, or site, preserve cmp-manifest/v1 conventions, or implement interactive cleanup/event support without turning the project into a framework component system.
---

# Open Lab Components

## Overview

Treat this repository as a zero-dependency HTML fragment component library for STEM education.
Keep the existing product boundary:

- Use single-file `.html` components under `components/`
- Keep `cmp-manifest/v1`
- Preserve direct HTML consumption plus registry-driven discovery
- Prefer compatibility over large schema or architecture changes

Do not treat this repo as a React, Vue, or design-system package.

## Start Here

Read these files first when the task touches project-wide behavior:

- `index.js`
- `index.d.ts`
- `tools/build-registry/index.js`
- `tools/validate/index.js`
- `site/components.html`
- `site/playground.html`
- `docs/RUNTIME.md`

Read `references/project-rules.md` for the project conventions and `references/change-checklist.md` before final verification.

## Component Workflow

When adding or editing a component:

1. Inspect nearby components in the same category before changing structure or naming.
2. Keep the manifest at the top of the file in the existing comment format.
3. Keep a single `.cmp` root with `data-cmp-id`.
4. Keep styles local to the component. Do not add external assets or global CSS selectors.
5. Keep scripts inline and self-contained. Do not introduce framework runtime dependencies.

For interactive components:

- Declare `events` in the manifest when the component emits structured events.
- Prefer explicit cleanup registration through `root.__olcRegisterCleanup(...)`.
- If the component uses `MutationObserver`, `requestAnimationFrame`, timers, or document/window listeners, make cleanup unambiguous.
- Preserve existing behavior and event names unless the task explicitly changes them.

For static components:

- Prefer minimal script usage.
- If a `MutationObserver` exists only to react to `data-props` or style changes, keep it simple and local.

## Runtime And Registry Rules

When changing library behavior:

- Keep `Manifest -> registry -> types -> site` consistent.
- If a manifest field is typed and documented for consumers, ensure the registry exposes it.
- Keep `mount`, `unmount`, and `updateProps` compatible with existing component usage.
- Use the runtime cleanup contract instead of forcing full rewrites across all components.

Do not:

- Upgrade the schema unless the user explicitly asks
- Convert components to multi-file or framework-based implementations
- Mass-rewrite low-risk legacy components without a concrete reason

## Validation

Run these commands after meaningful changes:

```powershell
npm run validate
npm run build:registry
npm run check:registry
npm run build:site
```

If a task changes only one local component, still run at least `validate`. If a task changes runtime, registry, validator, or site behavior, run the full set.

## Output Expectations

When reporting work:

- Summarize user-facing or maintainer-facing impact first
- Call out any files intentionally left untouched
- Mention validation commands that passed
- Mention if browser-side interactive testing was not performed
