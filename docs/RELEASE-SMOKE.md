# Release Smoke

Use this check before publish or release tagging:

```bash
npm run check:release
```

This verifies both publishable packages can still be packed and that key files
are present in the tarball manifests.

## What it checks

For the root package:

- `npm pack --dry-run`
- package name matches `@itkdm/open-lab-components`
- `index.js` is included
- `index.d.ts` is included
- `registry/registry.json` is included

For the MCP package:

- `npm pack --dry-run`
- package name matches `@itkdm/open-lab-components-mcp`
- `src/core/cli.js` is included
- `src/core/http-cli.js` is included
- `README.md` is included

## Relationship to existing release commands

- `npm run check:root` protects the root library quality path
- `npm run check:release` protects package packing surfaces
- `npm run release:ready` remains the broader repo-level release workflow

Run all three before publish if the repo is in a release state.
