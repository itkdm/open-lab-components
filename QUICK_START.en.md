# Quick Start: Adding a New Component

## Recommended Workflow

After adding or updating a component, follow this sequence:

### 1. Validate the component

```bash
npm run validate
```

This checks manifest structure, DOM contract, CSS isolation, and other component rules.

### 2. Rebuild the registry

```bash
npm run build:registry
```

This extracts manifest metadata from component files and regenerates:

- `registry/registry.json`
- `registry/categories.json`
- `registry/tags.json`

If you skip this step, the new component will not appear in the generated registry outputs.

### 3. Rebuild the site if needed

```bash
npm run build
```

Or run the steps separately:

```bash
npm run build:registry
npm run build:site
```

### 4. Preview locally if needed

```bash
npm run dev:site
```

Then visit `http://localhost:3000`.

## Example Workflow

Suppose you added `phy.apparatus.spring.basic.html`:

```bash
npm run validate
npm run build:registry
npm run dev:site

git add components/physics/apparatus/phy.apparatus.spring.basic.html
git add registry/*.json
git commit -m "Add spring component"
git push
```

## FAQ

### What happens if I forget `build:registry`

The component file itself still exists, but it will not appear in the generated registry or site outputs.

### Can I edit `registry/*.json` by hand

No. Those files are generated and will be overwritten on the next build.

### Do I need to run every command every time

- required: `npm run validate`, `npm run build:registry`
- optional: `npm run build:site`, `npm run dev:site`

### Does CI rebuild automatically

Yes. GitHub Actions runs the build workflow on push, but you should still validate locally first.

## Related Docs

- [Component Spec](./docs/SPEC.en.md)
- [Contribution Guide](./docs/CONTRIBUTING.en.md)
- [Category Rules](./docs/CATEGORY.en.md)

## Root Repository Checks

Before commit, run:

```bash
npm run check:root
```

This covers docs, text, scripts, root API, runtime harness, and component validation boundaries in one pass.
