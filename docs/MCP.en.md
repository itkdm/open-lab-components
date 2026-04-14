# MCP Server

[中文](./MCP.zh-CN.md) | [Legacy 中文入口](./MCP.md)

Open Lab Components ships a standalone MCP package in [mcp-server/](../mcp-server/) so local clients, hosted services, and AI agents can discover, recommend, and retrieve the same component catalog.

## Current Scope

The implementation is no longer limited to the earliest "read-only stdio catalog" shape. The MCP subsystem in this repository currently supports:

- local `stdio` mode
- remote `Streamable HTTP` mode
- tools, prompts, and resources
- locale-aware component discovery and retrieval
- recommendation feedback and page composition workflows

One important boundary still holds:

- MCP does not create, edit, or validate component source files

## Current Public Tools

- `get_categories({ locale? })`
- `list_components({ category?, tag?, hasEvents?, limit?, locale? })`
- `search_components({ query, category?, limit?, locale? })`
- `recommend_components({ subject, lessonGoal, audience?, interactionMode?, preferredCategories?, excludeCategories?, mustIncludeTags?, limit?, locale? })`
- `submit_recommendation_feedback({ componentId, feedbackType, subject?, lessonGoal?, audience?, interactionMode?, preferredCategories?, mustIncludeTags?, signalWeight? })`
- `get_recommendation_feedback_stats({ customerId? })`
- `build_experiment_page({ subject, lessonGoal, audience?, interactionMode?, pageType?, preferredCategories?, mustIncludeTags?, maxComponents?, locale? })`
- `compose_experiment_bundle({ subject?, lessonGoal?, audience?, interactionMode?, pageType?, componentIds?, preferredCategories?, mustIncludeTags?, maxComponents?, locale? })`
- `get_component({ id, locale? })`

Notes:

- `list_components` and `search_components` return summaries, not HTML
- `get_component` returns the full component record plus HTML
- the other tools cover recommendation, feedback, lesson planning, and render-ready bundle composition

## Current Public Prompts

- `component-recommendation-brief`
- `component-page-builder`
- `experiment-page-executor`
- `experiment-bundle-integrator`

These prompt templates help agents orchestrate the MCP tools for selection, planning, and bundle integration tasks.

## Current Public Resources

- `openlab://catalog/overview`
- `openlab://catalog/categories`
- `openlab://catalog/featured`
- `openlab://component/phy.resistor.axial.basic`

These resources provide quick catalog context for hosts and agents.

## Local Development

Install the MCP package dependencies:

```bash
cd mcp-server
npm install
```

Start the local `stdio` server:

```bash
npm start
```

Start it from the repo root:

```bash
npm run mcp:start
```

Start the remote HTTP entrypoint:

```bash
npm run mcp:start:http
```

Run tests:

```bash
npm run mcp:test
```

## Local Client Configuration

For local `stdio` clients such as Claude Desktop, configure:

- command: `node`
- args: absolute path to `mcp-server/src/core/cli.js`

Example:

```json
{
  "mcpServers": {
    "open-lab-components": {
      "command": "node",
      "args": [
        "/absolute/path/to/open-lab-components/mcp-server/src/core/cli.js"
      ]
    }
  }
}
```

## Remote HTTP Runtime

The remote entrypoints are:

- `mcp-server/src/core/http-cli.js`
- `mcp-server/src/core/remote-server.js`

Remote mode supports:

- bearer token authentication
- per-customer tool allowlists
- session TTL and concurrent session limits
- rate limiting
- `/healthz`, `/readyz`, and `/metrics`
- persisted feedback and reranking recovery
- file, Redis, and PostgreSQL backends

See:

- [MCP_REMOTE.md](./MCP_REMOTE.md)
- [mcp-server/DEPLOYMENT.md](../mcp-server/DEPLOYMENT.md)
- [mcp-server/OPERATIONS.md](../mcp-server/OPERATIONS.md)

## Locale Behavior

- default locale: `zh-CN`
- supported locales: `zh-CN`, `en`
- every public tool accepts an optional `locale`
- responses keep the full `locales` payload
- display fields fall back field-by-field to `zh-CN` when the requested locale is missing

## Publishing Boundary

The MCP server is published as a separate npm package:

- package: `@itkdm/open-lab-components-mcp`
- binaries:
  - `open-lab-components-mcp`
  - `open-lab-components-mcp-http`

## Related Docs

- [中文文档](./MCP.zh-CN.md)
- [Legacy 中文入口](./MCP.md)
- [mcp-server README](../mcp-server/README.md)
- [mcp-server 中文说明](../mcp-server/README.zh-CN.md)
- [I18N Release Notes](./RELEASE-2026-03-I18N.md)
