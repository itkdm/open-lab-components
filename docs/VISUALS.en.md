# Visual Assets

## Purpose

`visuals/` is the source-of-truth folder for reusable teaching visuals.

These assets cover classroom moments where a teacher needs a clear static
visual instead of an interactive component, such as:

- concept maps
- flowcharts
- process diagrams
- experiment procedure boards
- lesson-ready structure diagrams

## Why This Exists

Open Lab Components started as a reusable HTML teaching component library.
The visual asset module extends the same model to static teaching media:

- one structured source folder
- generated registries in `registry/visuals*.json`
- root package APIs through `lab.visuals.*`
- site browsing through `site/visuals.html`
- MCP discovery through visual-focused tools and resources

This gives teachers, product teams, and AI clients one stable gallery instead
of generating one-off images repeatedly.

## Directory Contract

Each asset lives inside a subject directory under `visuals/` and is defined by:

- one metadata file: `*.json`
- one asset file such as `*.svg`

Example:

```text
visuals/
  physics/
    vis.physics.series-circuit-flow.json
    vis.physics.series-circuit-flow.svg
```

## Metadata Schema

Current metadata fields:

- `schema`
- `id`
- `subject`
- `topic`
- `type`
- `version`
- `format`
- `asset`
- `thumbnail`
- `gradeRange`
- `relatedComponents`
- `size`
- `locales`

Localized fields currently include:

- `title`
- `summary`
- `tags`

## Authoring Rules

1. Put every visual inside the correct subject folder.
2. Use stable ids with the `vis.<subject>.*` prefix.
3. Keep the asset useful without surrounding page context.
4. Prefer teaching clarity over decorative illustration.
5. Add `relatedComponents` when a visual pairs naturally with existing HTML components.
6. Keep `zh-CN` complete; add `en` whenever possible.

## Build Output

Run:

```bash
npm run build:registry
```

This generates:

- `registry/visuals.json`
- `registry/visuals.zh-CN.json`
- `registry/visuals.en.json`
- `registry/visual-subjects*.json`
- `registry/visual-tags*.json`

## API Surface

Shared prompt guide:

- `docs/VISUAL-PROMPTS.en.md`

Root package:

```js
const lab = require("@itkdm/open-lab-components");

const visuals = lab.visuals.list({ subject: "physics" }, { locale: "en" });
const visual = lab.visuals.get("vis.physics.series-circuit-flow", { locale: "en" });
const rawSvg = lab.visuals.readSync("vis.physics.series-circuit-flow");
```

MCP:

- `list_visuals`
- `search_visuals`
- `get_visual`
- `openlab://visuals/overview`

## Recommended First Asset Types

If you are adding more assets, prioritize:

1. subject knowledge maps
2. experiment procedure diagrams
3. structural or apparatus diagrams
4. lesson summary boards

Those are usually more stable and reusable than decorative illustrations.
