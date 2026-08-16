# Showcase and Adoption Notes

English | [中文](./SHOWCASE.zh-CN.md)

This note collects practical adoption paths for Open Lab Components before a
team commits to a deeper integration. It focuses on low-friction scenarios that
reuse the existing component catalog, registry data, static site, and MCP
surface without changing component source files.

## Recommended Entry Points

| Scenario | Best Entry | Why it fits |
| --- | --- | --- |
| Teacher preview | `site/` | Browse and compare components visually before reusing fragments. |
| LMS or content platform | `registry/*.json` + `components/**/*.html` | Keep component metadata and HTML fragments separate from the host layout. |
| Frontend integration | `index.js` | Query, read, mount, unmount, and update components through one JS API. |
| AI assistant workflow | `mcp-server/` | Let agents search, recommend, and compose experiment page bundles. |
| Visual teaching assets | `visuals/` | Reuse subject diagrams and knowledge visuals alongside HTML components. |

## Promotion-Ready Demo Flow

1. Run `npm run build` to refresh registry data and static site output.
2. Run `npm run dev:site` and open the local site.
3. Pick one interactive physics component, one chemistry or biology component,
   and one visual asset to demonstrate cross-subject coverage.
4. Show the matching registry entry to highlight the source-of-truth workflow.
5. For AI-oriented demos, start the MCP server and ask for a component
   recommendation or experiment page bundle.

## Integration Notes

- Treat `components/` as the authoring source and `registry/` as generated
  catalog output.
- Keep host page layout, lesson copy, and global styling outside the component
  fragments.
- Use `locale` options in the JS API or MCP tools when building bilingual
  experiences.
- Prefer the static site for content review and the JS API or MCP server for
  production integration.

## Verification

Before sharing a demo branch, run:

```bash
npm run validate
npm run build:registry
npm run check:registry
npm run build:site
npm run check:root
```
