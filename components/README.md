# Component Source Boundary

`components/` is the source of truth for reusable Open Lab Components HTML
fragments.

## Maintenance Notes

- Each component file should remain a single self-contained HTML fragment.
- Keep manifest metadata aligned with `docs/SPEC.md` and
  `registry/category-names.json`.
- After changing component source, run `npm run validate`,
  `npm run build:registry`, and `npm run check:registry`.
- Do not edit generated registry files as the primary way to change component
  metadata.
