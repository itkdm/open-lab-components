# Release Notes: Locale-Aware Metadata and `cmp-manifest/v2`

This release upgrades Open Lab Components from a single-language component library to a locale-aware component infrastructure.

## Highlights

- Added `cmp-manifest/v2` for localized metadata
- Added locale-aware registry outputs
- Added locale support to the JS API
- Added locale support to the MCP server
- Added locale-aware loading to the site
- Migrated the full component catalog to the `v2` manifest shape
- Completed an English metadata refinement pass across high-frequency subjects

## What Changed

### 1. `cmp-manifest/v2`

Component metadata now supports:

- `locales["zh-CN"]`
- `locales["en"]`

Locale-specific fields include:

- `name`
- `tags`
- `ariaLabel`
- localized prop labels and descriptions
- localized event labels, descriptions, and value text

Language-neutral fields remain at the top level:

- `id`
- `schema`
- `category`
- `version`
- `viewport`
- `props[].key`
- `cssVars`

### 2. Registry Outputs

The registry now publishes both raw and localized views:

- `registry/registry.json`
- `registry/registry.zh-CN.json`
- `registry/registry.en.json`
- `registry/categories.zh-CN.json`
- `registry/categories.en.json`
- `registry/tags.zh-CN.json`
- `registry/tags.en.json`

Use the localized views by default in hosts, sites, and tools. Fall back field-by-field to `zh-CN` when a locale-specific field is missing.

### 3. JS API

The public JS API remains backward-compatible, with added locale options:

```js
const lab = require('@itkdm/open-lab-components');

const zhItems = lab.list();
const enItems = lab.list({}, { locale: 'en' });

const zhComponent = lab.get('phy.optics.lens.convex.interactive');
const enComponent = lab.get('phy.optics.lens.convex.interactive', { locale: 'en' });
```

`readSync`, `read`, `resolve`, `mount`, and `updateProps` keep their previous runtime behavior.

### 4. MCP

All public MCP tools now accept an optional `locale` argument:

- `get_categories({ locale })`
- `list_components({ category?, tag?, hasEvents?, limit?, locale? })`
- `search_components({ query, category?, limit?, locale? })`
- `get_component({ id, locale? })`

If omitted, the server resolves display fields with `zh-CN`.

### 5. Site

The site now resolves locale in this order:

1. `?lang=`
2. `localStorage`
3. browser language
4. default `zh-CN`

Localized registry assets are published into the site build so the UI can switch languages without reading component manifests directly.

## Migration Notes

### From `cmp-manifest/v1`

`cmp-manifest/v1` is still readable during the transition period, but new work should use `cmp-manifest/v2`.

Recommended migration path:

1. Move display fields into `locales`
2. Keep language-neutral fields at the top level
3. Add `zh-CN` first
4. Add `en`
5. Regenerate the registry and validate

### Fallback Rule

Consumers should resolve metadata field-by-field:

- try requested locale
- if missing, fall back to `zh-CN`

Do not assume all locales are fully populated forever.

## Verification

This release was verified with:

- `npm run release:ready`
- `npm run release:check`
- `npm run release:pack`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`

## Recommended Consumer Actions

- Prefer `registry/registry.<locale>.json` over raw manifest scraping
- Pass `locale` explicitly in MCP clients
- Pass `locale` explicitly in host-side `list/get` calls
- Treat `registry/registry.json` as the raw multi-locale source of truth

## Follow-Up

The next product-layer work should build on this base, not around it:

- scene composition metadata
- scene/runtime APIs
- multilingual experiment demos
- public release packaging and upgrade communication
