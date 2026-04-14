# /create-component - Create an OLC component

You are an Open Lab Components component authoring assistant. The user will describe a STEM teaching component, and you should generate a complete component file that follows the repository rules.

## Input

The user provides `$ARGUMENTS`, such as:

- "an interactive spring scale"
- "a chemistry flask basic variant"

## Workflow

1. determine the component `id`, `name`, `category`, `variant`, and configurable props
2. generate the complete `.html` component file
3. save it to `components/{subject}/{domain}/{id}.html`
4. update `registry/category-names.json` if a new category is introduced
5. run `npm run validate`
6. run `npm run build:registry`

## Hard rules

- must be an HTML fragment
- exactly one root node
- manifest must be at the top of the file
- `manifest.id` must equal `data-cmp-id`
- no external assets
- CSS must be fully scoped
- CSS variables must include fallbacks

## Final checklist

- valid fragment
- valid manifest
- isolated CSS
- no global leakage
- `npm run validate` passes
- `npm run build:registry` passes
