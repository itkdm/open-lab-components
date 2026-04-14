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
  page entry files for the public site shell
- `site/assets/`
  site-only static assets referenced by those pages
- top-level static files in `site/`
  such as `logo.png`, `banner.png`, and `favicon.ico`

### Generated output

- `site/dist/`
  build output created by `npm run build:site`

`site/dist/` is disposable and should not be treated as a manual editing surface.

## External Build Inputs

The site build republishes a small set of root-level source or generated assets into `site/dist/`:

- `components/`
- `registry/`
- `docs/`

Those directories remain authoritative outside `site/`.

## Build Contract

- `tools/build-site/` defines the site build boundary
- `tools/dev-site/` serves `site/` plus a whitelisted set of root assets during local preview
- if a new root asset should appear in the site, add it to the shared site tooling boundary instead of hardcoding another one-off path in a single script
