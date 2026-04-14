# Site Boundary

## Purpose

`site/` contains the source shell for the public static preview and
documentation site.

It is not the source of truth for component data.

## Source vs generated content

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

`site/dist/` is disposable and should be treated as generated output, not as a
manual editing surface.

## External build inputs

The site build intentionally copies a small set of root-level generated or
source assets into `site/dist/`:

- `components/`
- `registry/`
- `docs/`

Those remain authoritative outside `site/`. The site only republishes them for
static hosting.

## Build contract

- `tools/build-site/` defines the site build boundary
- `tools/dev-site/` serves `site/` source files plus a whitelisted set of root
  assets during local preview
- if a new root asset needs to be visible in the site, add it to the shared
  site tooling boundary first instead of hardcoding another path in one script
