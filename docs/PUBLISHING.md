# Publishing Guide

This repository now includes two publish-ready packages:

- root package: `@itkdm/open-lab-components`
- MCP package: `@itkdm/open-lab-components-mcp`

## Recommended flow

1. Run:

```bash
npm run release:ready
```

2. Review:

- `CHANGELOG.md`
- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`
- `docs/RELEASE-CHECKLIST-0.2.0.md`
- `docs/RELEASE-COMMANDS-0.2.0.md`

3. Commit the release changes.

4. Create the tag:

```bash
git tag v0.2.0
```

5. Publish the root package:

```bash
npm publish
```

6. Publish the MCP package:

```bash
npm --prefix mcp-server publish
```

7. Push the branch and tag:

```bash
git push origin <branch>
git push origin v0.2.0
```

8. Create the GitHub Release using:

- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`

## Notes

- `release:check` validates the repo and rebuilds publish artifacts
- `release:pack` verifies both npm packages can be packed with the current file lists
- `release:ready` runs both checks in sequence
