# Release Checklist: 0.2.0

## Versioning

- [ ] Confirm root package version is `0.2.0`
- [ ] Confirm MCP package version is `0.2.0`
- [ ] Confirm `CHANGELOG.md` matches the shipped scope

## Validation

- [ ] Run `npm run release:ready`
- [ ] Run `npm run release:check`
- [ ] Run `npm run release:pack`
- [ ] Confirm `npm run release:check` still expands to `validate -> build:registry -> mcp:test -> build:site`
- [ ] Run `npm run validate`
- [ ] Run `npm run build:registry`
- [ ] Run `npm run mcp:test`
- [ ] Run `npm run build:site`

## Docs

- [ ] Review [`README.en.md`](./../README.en.md)
- [ ] Review [`README.md`](./../README.md)
- [ ] Review [`docs/RELEASE-2026-03-I18N.md`](./RELEASE-2026-03-I18N.md)
- [ ] Review [`docs/GITHUB-RELEASE-0.2.0.md`](./GITHUB-RELEASE-0.2.0.md)
- [ ] Review [`mcp-server/README.md`](./../mcp-server/README.md)

## Registry and Site Output

- [ ] Confirm `registry/registry.json` is present
- [ ] Confirm `registry/registry.zh-CN.json` is present
- [ ] Confirm `registry/registry.en.json` is present
- [ ] Confirm site build includes localized registry assets

## Publish

- [ ] Create git tag `v0.2.0`
- [ ] Publish root package to npm
- [ ] Publish MCP package to npm
- [ ] Create GitHub Release from [`docs/GITHUB-RELEASE-0.2.0.md`](./GITHUB-RELEASE-0.2.0.md)

## Post-Release

- [ ] Announce the locale-aware metadata rollout
- [ ] Point integrators to localized registry views
- [ ] Start the first multilingual experiment demo based on this release
