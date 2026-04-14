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

1. `npm run release:ready`
2. review diff
3. commit
4. tag
5. publish root package
6. publish MCP package
7. push branch and tag
8. create GitHub Release
