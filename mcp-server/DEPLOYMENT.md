# MCP Server Deployment

This note is the shortest path to a working hosted deployment of the Open Lab Components MCP server.

## Prerequisites

- Node.js 18+
- a writable `config/` directory for customer configuration
- a writable `data/` directory for the file feedback backend
- reverse proxy or ingress if you want HTTPS and origin control

## 1. Install dependencies

```bash
cd mcp-server
npm install
```

## 2. Prepare environment

Start from `.env.example` and set at least:

```bash
HOST=127.0.0.1
PORT=3000
CUSTOMERS_CONFIG_PATH=./config/customers.json
LOG_LEVEL=info
ALLOWED_HOSTS=
ALLOWED_ORIGINS=
TRUST_PROXY=false
ADMIN_BEARER_TOKEN=replace-with-admin-token
METRICS_BEARER_TOKEN=replace-with-metrics-token
FEEDBACK_STORE_PATH=./data/feedback-store.json
```

Recommended:

- set `ADMIN_BEARER_TOKEN` for all hosted environments
- set `METRICS_BEARER_TOKEN` if `/metrics` should not rely on the admin token
- set `ALLOWED_ORIGINS` when browser-based admin or monitoring pages need CORS access
- set `TRUST_PROXY=true` only when you are actually behind a trusted reverse proxy

## 3. Create customer config

Copy the example file:

```bash
cp ./config/customers.example.json ./config/customers.json
```

If you are deploying from the published package instead of a git checkout, the same example file is included in the tarball.

Then replace the placeholder `tokenHash` with a real SHA-256 token hash generated from:

```bash
npm run token:generate
```

The example file includes:

- one full-access customer using `allowedTools: ["*"]`
- one restricted customer showing a smaller tool allowlist and tighter rate limit

Each customer record supports:

- `customerId`
- `label`
- `tokenHash`
- `status`
- `rateLimit`
- `allowedTools`
- `expiresAt`

## 4. Start the HTTP server

```bash
npm run start:http
```

If you run under `systemd`, start from:

- `deploy/systemd/open-lab-components-mcp.service.example`

If you place the service behind Nginx, start from:

- `deploy/nginx/open-lab-components-mcp.conf.example`

Expected operational routes:

- `/healthz`
- `/readyz`
- `/metrics`
- `/admin/overview`
- `/admin/customers`
- `/mcp`

## 5. Verify the deployment

Health:

```bash
curl http://127.0.0.1:3000/healthz
```

Admin overview:

```bash
curl \
  -H "Authorization: Bearer $ADMIN_BEARER_TOKEN" \
  -H "x-request-id: deploy-check-1" \
  http://127.0.0.1:3000/admin/overview
```

Metrics:

```bash
curl \
  -H "Authorization: Bearer $METRICS_BEARER_TOKEN" \
  http://127.0.0.1:3000/metrics
```

## 6. Operational signals to watch

For admin traffic:

- `x-request-id` is echoed by every `/admin/*` route
- `admin_customer_write_succeeded` and `admin_customer_write_failed` are logged with the same request id
- `/metrics` and `/admin/overview` expose:
  - `adminWrites`
  - `adminWriteSummary`

For error diagnosis:

- inspect response `category`
- search logs by `requestId`
- confirm the matching `adminWriteSummary` counter increases

More detail:

- request tracing, audit logs, and admin metric semantics are documented in [OPERATIONS.md](./OPERATIONS.md)
- rollout checks are listed in [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
- reusable deployment templates live under [`deploy/`](./deploy)
