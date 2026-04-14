# GitHub Release Draft: v0.2.0

## Title

`v0.2.0 - Locale-aware metadata, cmp-manifest/v2, and MCP locale support`

## Summary

This release upgrades Open Lab Components from a default single-language component library to a locale-aware component infrastructure.

It introduces `cmp-manifest/v2`, localized registry outputs, locale-aware JS API and MCP responses, and a full-catalog migration to the new metadata shape.

## Highlights

- Added `cmp-manifest/v2`
- Added localized registry views for `zh-CN` and `en`
- Added `locale` support to the public JS API
- Added `locale` support to all public MCP tools
- Updated the site to load locale-specific registry assets
- Migrated the full catalog to the new manifest structure
- Refined English metadata across high-frequency subject areas

## For Integrators

- Prefer `registry/registry.<locale>.json` over direct manifest scraping
- Pass `locale` explicitly in host-side `list/get` calls
- Pass `locale` explicitly in MCP client calls
- Keep `registry/registry.json` as the raw multi-locale source of truth

## Compatibility

- Existing runtime mounting behavior is unchanged
- `cmp-manifest/v1` is still readable during the migration window
- Fallback locale remains `zh-CN`

## Verification

- `npm run release:ready`
- `npm run release:check`
- `npm run release:pack`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`

## Docs

- [Release notes](./RELEASE-2026-03-I18N.md)
- [Component spec](./SPEC.md)
- [Integration guide](./INTEGRATION.md)
- [MCP guide](./MCP.md)
