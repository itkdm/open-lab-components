# Library Runtime Boundary

`lib/` contains the shared runtime, registry, catalog, and locale helpers used
by the root package and related tooling.

## Maintenance Notes

- Keep public API behavior aligned with `index.js` and `index.d.ts`.
- Prefer small shared helpers over duplicating registry or locale logic in
  tools and MCP entrypoints.
- Run `npm run test:root` and `npm run check:root` after changing runtime
  behavior.
