# Publishing Guide

This repository now includes two publish-ready packages:

- root package: `@itkdm/open-lab-components`
- MCP package: `@itkdm/open-lab-components-mcp`

## Recommended flow

1. Run the root quality path:

```bash
npm run check:root
```

2. Run the release smoke checks:

```bash
npm run check:release
```

3. Run the broader release checks:

```bash
npm run release:ready
```

4. Review:

- `CHANGELOG.md`
- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`
- `docs/RELEASE-CHECKLIST-0.2.0.md`
- `docs/RELEASE-COMMANDS-0.2.0.md`

5. Commit the release changes.

6. Create the tag:

```bash
git tag v0.2.0
```

7. Publish the root package:

```bash
npm publish
```

8. Publish the MCP package:

```bash
npm --prefix mcp-server publish
```

9. Push the branch and tag:

```bash
git push origin <branch>
git push origin v0.2.0
```

10. Create the GitHub Release using:

- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`

## Notes

- `release:check` validates the repo and rebuilds publish artifacts
- `release:pack` verifies both npm packages can be packed with the current file lists
- `release:ready` runs both checks in sequence
- `npm run check:root` covers the root library quality path before release work starts
- `npm run check:release` confirms both publishable packages still expose the expected tarball contents
