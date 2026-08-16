# Test Boundary

`tests/` contains root-package smoke and contract tests.

## Maintenance Notes

- Keep root API coverage close to the exported surface in `index.js` and
  `index.d.ts`.
- Add focused tests when registry, locale, visual, or runtime contracts change.
- Use `npm run test:root` for root API checks and `npm run check:root` for the
  broader root quality gate.
