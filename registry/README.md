# Registry Boundary

`registry/` contains generated catalog, category, tag, visual, and locale
artifacts derived from component and visual source files.

## Maintenance Notes

- `category-names.json` is a maintained input.
- Most other JSON files in this directory are generated outputs.
- Use `npm run build:registry` to refresh registry artifacts.
- Use `npm run check:registry` before committing generated registry changes.
