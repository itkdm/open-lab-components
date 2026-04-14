"# Architecture"

## Purpose

This repository is a multi-surface product for STEM teaching components.
It serves the same component assets through three delivery surfaces:

- the root npm library
- the static documentation and showcase site
- the MCP server package

The current repository intentionally keeps the root library at the repo root and
does not use npm workspaces yet.

## Top-level boundaries

### Source assets

- `components/`
  The source of truth for all component HTML fragments and embedded manifests.
- `lib/`
  Shared runtime and i18n logic consumed by the root library.
- `tests/`
  Root-package smoke tests.

### Generated outputs

- `registry/`
  Generated registry, category, tag, and i18n-report artifacts.
  Only `registry/.gitkeep` and `registry/category-names.json` are treated as
  source-controlled inputs.
- `site/dist/`
  Generated static site output.

### Applications and publish surfaces

- repo root
  Publishable npm package: `@itkdm/open-lab-components`
- `mcp-server/`
  Publishable npm package: `@itkdm/open-lab-components-mcp`
- `site/`
  Static app shell for preview, docs, and playground pages
  See `site/README.md` for source vs generated boundaries.

### Tooling

- `tools/build-registry/`
  Scans `components/` and emits generated registry artifacts.
- `tools/validate/`
  Validates component structure and manifest constraints.
- `tools/check-registry/`
  Verifies generated registry output matches source manifests.
- `tools/check-root/`
  Root quality entrypoint for smoke tests and validation.
- `tools/runtime-harness/`
  Isolated DOM harness used only for runtime lifecycle verification.
- `tools/build-site/`
  Produces `site/dist/` from site sources plus generated assets.
- `tools/dev-site/`
  Local preview server for the static site shell and whitelisted root assets.
- `tools/release-smoke/`
  Pack-level release verification for both publishable packages.

## Architectural rules

1. `components/` is the only authoritative source for component content.
2. `registry/*.json` is generated output and must not be edited manually.
3. Root-package runtime logic stays in `lib/`, not inside tooling scripts.
4. `mcp-server/` may consume the root package but keeps its runtime concerns
   isolated inside its own package.
5. `tools/runtime-harness/` is a quality-only boundary; it is not a product
   package.
6. Runtime data such as `mcp-server/data/` is local operational state and is
   not source-controlled.

## Entry points

### Root library

- `npm run check:root`
- `npm run build:registry`
- `npm run build:site`
- `npm run test`

### MCP package

- `npm run mcp:test`
- `npm run mcp:test:remote`
- `npm run mcp:start`
- `npm run mcp:start:http`

### Release verification

- `npm run check:release`
- `npm run release:check`
- `npm run release:pack`

## Current direction

The repository is being cleaned up by tightening boundaries first, not by
moving packages aggressively. The current target is:

- shared path and script conventions at the root
- explicit source vs generated vs runtime-data separation
- stable CI entrypoints

Workspace migration can be reconsidered later after those boundaries remain
stable.
