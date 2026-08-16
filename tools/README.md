# Tooling Boundary

`tools/` contains repository maintenance scripts for validation, registry
generation, site builds, release checks, and shared package boundaries.

## Maintenance Notes

- Prefer shared helpers in `tools/_lib/` when multiple scripts need the same
  path, package, release, or generated-artifact contract.
- Keep script names aligned with `package.json` and
  `tools/_lib/script-manifest.js`.
- Run `npm run check:scripts` after changing package scripts or tooling
  manifests.
