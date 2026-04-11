# Open Lab Components MCP Server

Locale-aware MCP server for discovering and retrieving components from the Open Lab Components library.

This package supports:

- local `stdio` mode for VS Code and local MCP clients
- remote `Streamable HTTP` mode for hosted access
- locale-aware summaries and component lookup
- MCP tools, prompts, and reference resources
- bearer auth, per-customer tool permissions, rate limiting, and session governance
- health, readiness, metrics, and structured request logging

## What it exposes

### Tools

- `get_categories`
- `list_components`
- `search_components`
- `recommend_components`
- `submit_recommendation_feedback`
- `get_recommendation_feedback_stats`
- `build_experiment_page`
- `compose_experiment_bundle`
- `get_component`

All public tools accept an optional `locale` parameter.

### Prompts

- `component-recommendation-brief`
- `component-page-builder`
- `experiment-page-executor`
- `experiment-bundle-integrator`

### Resources

- `openlab://catalog/overview`
- `openlab://catalog/categories`
- `openlab://catalog/featured`
- `openlab://component/phy.resistor.axial.basic`

This release remains intentionally read-only. It does not create, edit, or validate components through MCP.

## Local usage

```bash
cd mcp-server
npm install
npm start
```

From the repo root:

```bash
npm run mcp:start
```

Optional backend integration tests:

- set `REDIS_URL` to run the Redis feedback backend test
- set `POSTGRES_URL` to run the PostgreSQL feedback backend test
- run `npm run mcp:test`

## Remote HTTP usage

Create a customer config file from the example:

```bash
cp ./config/customers.example.json ./config/customers.json
```

The published package also ships `config/customers.example.json` as the baseline hosted config template.

Generate a bearer token and config entry:

```bash
npm run token:generate
```

Start the remote server:

```bash
npm run start:http
```

Environment variables:

- `HOST`
- `PORT`
- `CUSTOMERS_CONFIG_PATH`
- `LOG_LEVEL`
- `ALLOWED_HOSTS`
- `ALLOWED_ORIGINS`
- `TRUST_PROXY`
- `ADMIN_BEARER_TOKEN`
- `SESSION_TTL_MS`
- `MAX_SESSIONS_PER_CUSTOMER`
- `METRICS_BEARER_TOKEN`
- `FEEDBACK_STORE_PATH`
- `FEEDBACK_HALF_LIFE_DAYS`
- `FEEDBACK_STORE_BACKEND`
- `REDIS_URL`
- `REDIS_FEEDBACK_KEY`
- `POSTGRES_URL`
- `POSTGRES_FEEDBACK_TABLE`
- `POSTGRES_FEEDBACK_STORE_KEY`

Operational guidance for admin tracing, error categories, and metrics:

- see [OPERATIONS.md](./OPERATIONS.md)

Remote deployment walkthrough:

- see [DEPLOYMENT.md](./DEPLOYMENT.md)

Deployment readiness checklist:

- see [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

## Claude Desktop example

Use the published binary or a local repo checkout. Example local command:

```json
{
  "mcpServers": {
    "open-lab-components": {
      "command": "node",
        "args": [
        "D:/develop/project/edu-html/组件库/open-lab-components/mcp-server/src/core/cli.js"
        ]
      }
    }
}
```

## Tool behavior

### `get_categories`

Returns all categories with localized names and component counts.

### `list_components`

Returns filtered component summaries resolved for the requested locale. It never returns HTML.

### `search_components`

Runs deterministic lexical matching over ids, names, tags, and category metadata across supported locales.

### `recommend_components`

Returns explainable recommendations for lesson and product scenarios using subject, goal, audience, category, tag, and interaction signals.
For remote clients, authenticated customer ids are injected automatically so reranking stays tenant-isolated.

### `submit_recommendation_feedback`

Records click, selection, save, dismiss, or hide signals so future recommendations can rerank dynamically.

### `get_recommendation_feedback_stats`

Returns feedback aggregates used by the in-memory reranking layer.

### `build_experiment_page`

Returns a structured lesson or experiment page plan with sections, selected component ids, implementation notes, and assembly steps.

### `compose_experiment_bundle`

Returns a render-ready bundle with component HTML, layout hints, render order, and host integration instructions.

### `get_component`

Returns a full registry item plus complete HTML for a single component id.

## Enterprise runtime behavior

- customer-scoped bearer token authentication
- per-customer tool allowlists
- in-memory per-customer rate limiting with response headers
- session TTL and max concurrent sessions per customer
- request IDs and structured JSON logs
- `/healthz`, `/readyz`, and `/metrics` operational endpoints
- feedback event counters for recommendation tuning
- persistent feedback store for recommendation reranking recovery after restart
- time-decayed feedback scoring so stale interactions lose influence over time
- tenant-isolated reranking so one customer's behavior does not affect another customer's results
- pluggable persistence backends: file, Redis, PostgreSQL

## Locale behavior

- default locale: `zh-CN`
- supported locales: `zh-CN`, `en`
- responses keep the full `locales` payload
- display fields fall back to `zh-CN` when a requested locale field is missing

## Release notes

See [`../docs/RELEASE-2026-03-I18N.md`](../docs/RELEASE-2026-03-I18N.md) for the wider `cmp-manifest/v2` and locale-aware registry rollout.

For release preparation and package publishing, see [`../docs/PUBLISHING.md`](../docs/PUBLISHING.md) and [`../docs/RELEASE-CHECKLIST-0.2.0.md`](../docs/RELEASE-CHECKLIST-0.2.0.md).

## Remote deployment

See [`../docs/MCP_REMOTE.md`](../docs/MCP_REMOTE.md) for Nginx, HTTPS, customer config, and Linux service guidance.

## Control console

If you host a separate browser-based control console, configure `ALLOWED_ORIGINS`
to include that console origin so the browser can read `/healthz`, `/readyz`,
and `/metrics`.
