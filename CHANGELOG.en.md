# Changelog

## 0.2.0 - 2026-03

### Added

- `cmp-manifest/v2` with locale-aware metadata
- raw and localized registry outputs
- locale support for the public JS API
- locale support for all public MCP tools
- locale-aware site loading and switching
- release notes for the i18n and metadata rollout

### Changed

- migrated the full component catalog to the `v2` manifest shape
- refined English metadata across high-frequency physics, chemistry, biology, and math components
- updated package metadata to reflect protocol and runtime positioning

### Compatibility

- `cmp-manifest/v1` remains readable during the migration window
- default locale remains `zh-CN`
- hosts should prefer localized registry views and fall back field-by-field to `zh-CN`

### Verification

- `npm run release:ready`
- `npm run release:check`
- `npm run release:pack`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`
