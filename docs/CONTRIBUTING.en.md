# Contributing Guide

Contributions are welcome, including new components, bug fixes, and documentation improvements. To keep the repository maintainable, follow [SPEC.en.md](./SPEC.en.md) and [CATEGORY.en.md](./CATEGORY.en.md).

---

## 1. What You Need First

- understand that components must be HTML fragments
- expose configuration through CSS variables
- run local validation before opening a PR

---

## 2. Adding a New Component

### Step 1: copy a starting point

- copy the closest existing component or template
- place the file in the correct directory aligned with its category

### Step 2: fill the manifest

At minimum include:

- `schema`
- `id`
- `name`
- `category`
- `version`

Recommended additions:

- `viewport`
- `tags`
- `props`
- `cssVars`

Also ensure:

- `manifest.id` equals the root `data-cmp-id`
- the `id` is globally unique

### Step 3: build the component body

- root node should include `class="cmp"`, `role="img"`, and `aria-label`
- CSS must be scoped to the component root
- configurable values must read from `var(--cmp-xxx, fallback)`

### Step 4: self-check locally

Use the checklist in [SPEC.en.md](./SPEC.en.md):

- HTML fragment
- single root node
- no external assets
- scoped CSS
- CSS variables with fallbacks
- self-contained JS if any

### Step 5: validate and rebuild registry

```bash
npm run validate
npm run build:registry
npm run build
```

Meaning:

- `npm run validate`
  validates component rules
- `npm run build:registry`
  rebuilds `registry/*.json` from component manifests
- `npm run build`
  rebuilds the registry and site

Do not edit generated registry files by hand.

### Step 6: open a PR

Include:

- purpose and category of the component
- screenshots or GIFs in the PR description if helpful
- interaction behavior and edge cases for interactive components

---

## 3. Updating Existing Components

- bug fix -> usually patch version
- backward-compatible feature -> usually minor version
- breaking change -> major version plus migration notes

---

## 4. Reviewer Checklist

- no external assets or global style pollution
- `id`, `category`, and `tags` follow the rules
- props and CSS variables are clearly described
- the component stays focused on the teaching object itself
- any JS is self-contained and safe for host reuse

---

## 5. License Reminder

Unless stated otherwise, your contribution is licensed under the repository `LICENSE`.

## Root Quality Gate

Before opening a PR, run:

```bash
npm run check:root
```

This complements `npm run validate` and `npm run build:registry` by checking repository-level docs, scripts, API, and runtime boundaries.
