# Release Commands: 0.2.0

## Preflight

```bash
npm run release:ready
```

## Review

```bash
git status --short
```

```bash
git diff -- package.json mcp-server/package.json README.en.md README.md docs site/index.html
```

## Commit

Example commit message:

```bash
git add .
git commit -m "release: prepare v0.2.0 locale-aware metadata rollout"
```

## Tag

```bash
git tag v0.2.0
```

## Publish

```bash
npm publish
```

```bash
npm --prefix mcp-server publish
```

## Push

```bash
git push origin <branch>
git push origin v0.2.0
```

## GitHub Release

Use:

- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`

## Suggested order

1. `npm run check:root`
2. `npm run check:release`
3. `npm run release:ready`
4. `git diff -- package.json mcp-server/package.json README.en.md README.md docs site/index.html`
5. `git commit -m "release: prepare v0.2.0 locale-aware metadata rollout"`
6. `git tag v0.2.0`
7. `npm publish`
8. `npm --prefix mcp-server publish`
9. `git push origin <branch>`
10. `git push origin v0.2.0`
11. `docs/GITHUB-RELEASE-0.2.0.md`
12. `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`
