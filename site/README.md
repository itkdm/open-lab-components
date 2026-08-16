# Site Boundary

English | [中文](./README.zh-CN.md)

## Purpose

`site/` contains the source shell for the public static preview and documentation site.

It is not the source of truth for component metadata or MCP capabilities. Those come from:

- `components/`
- `registry/`
- `docs/`
- `mcp-server/`

The site republishes and presents those assets.

## Source vs Generated Content

### Source-controlled inputs

- `site/*.html`
  Page entry files for the public site shell
- `site/assets/`
  Site-only static assets referenced by those pages
- top-level static files in `site/`
  For example `logo.png`, `banner.png`, and `favicon.ico`

### Generated output

- `site/dist/`
  Build output created by `npm run build:site`

`site/dist/` is disposable and should not be treated as a manual editing surface.

## External Build Inputs

The site build intentionally republishes a small set of root-level source or generated assets into `site/dist/`:

- `components/`
- `registry/`
- `docs/`
- `visuals/`

Those directories remain authoritative outside `site/`.

## Build Contract

- `tools/build-site/` defines the site build boundary
- `tools/dev-site/` serves `site/` plus a whitelisted set of root assets during local preview
- if a new root asset should appear in the site, add it to the shared site tooling boundary instead of hardcoding another one-off path in a single script

## Maintenance Notes

- Keep page sources in `site/*.html`; treat `site/dist/` as generated output.
- Rebuild with `npm run build:site` after changing site sources or republished
  root assets.
- Prefer updating shared tooling boundaries when a new root asset needs to be
  published by the site build.
