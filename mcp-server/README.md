# Open Lab Components MCP Server

English | [中文](./README.zh-CN.md)

Locale-aware MCP server for discovering, recommending, and retrieving components from the Open Lab Components catalog.

## What This Package Exposes

### Transports

- local `stdio`
- remote `Streamable HTTP`

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

This package remains read-only with respect to component source files. It does not create, edit, or validate component HTML through MCP.

## Local Usage

```bash
cd mcp-server
npm install
npm start
```

From the repo root:

```bash
npm run mcp:start
npm run mcp:start:http
```

Run tests:

```bash
npm run mcp:test
```

Optional backend integration coverage:

- set `REDIS_URL` to enable the Redis feedback backend test
- set `POSTGRES_URL` to enable the PostgreSQL feedback backend test

## Remote HTTP Usage

Create a customer config from the shipped example:

```bash
cp ./config/customers.example.json ./config/customers.json
```

Generate a bearer token and config entry:

```bash
npm run token:generate
```

Start the remote server:

```bash
npm run start:http
```

Useful verification commands:

```bash
npm run check:docs
npm run check:scripts
npm run smoke:remote
npm run pack:check
```

Environment variables:

- `MCP_RUNTIME_HOME`
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

## Runtime Features

- bearer token authentication
- per-customer tool allowlists
- session TTL and max concurrent session limits
- in-memory rate limiting with headers
- structured logs and request ids
- `/healthz`, `/readyz`, and `/metrics`
- persisted recommendation feedback recovery
- file, Redis, and PostgreSQL feedback backends
- time-decayed reranking signals
- `/admin/overview`
- `/admin/customers`
- `/mcp`

## Locale Behavior

- default locale: `zh-CN`
- supported locales: `zh-CN`, `en`
- every public tool accepts an optional `locale`
- responses keep full `locales` payloads
- display fields fall back to `zh-CN` when needed

## Entry Points

Published binaries:

- `open-lab-components-mcp`
- `open-lab-components-mcp-http`

Local source entrypoints:

- `src/core/cli.js`
- `src/core/http-cli.js`

## Documentation

- [中文 README](./README.zh-CN.md)
- [Repository MCP docs](../docs/MCP.en.md)
- [Repository MCP 中文文档](../docs/MCP.zh-CN.md)
- [Remote deployment guide](../docs/MCP_REMOTE.en.md)
- [远程部署中文说明](../docs/MCP_REMOTE.zh-CN.md)
- [Deployment guide](./DEPLOYMENT.en.md)
- [部署说明](./DEPLOYMENT.zh-CN.md)
- [Deployment checklist](./DEPLOYMENT-CHECKLIST.en.md)
- [部署检查清单](./DEPLOYMENT-CHECKLIST.zh-CN.md)
- [Operations guide](./OPERATIONS.en.md)
- [运维说明](./OPERATIONS.zh-CN.md)
