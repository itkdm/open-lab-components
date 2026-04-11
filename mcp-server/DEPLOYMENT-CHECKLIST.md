# MCP Server Deployment Checklist

Use this before exposing the hosted MCP endpoint to real clients.

## Configuration

- `CUSTOMERS_CONFIG_PATH` points to a real writable file
- `config/customers.json` was copied from `config/customers.example.json`
- every customer has a real `tokenHash`, not `replace-with-sha256-hash`
- demo customer ids and labels were replaced with deployment-specific values
- `ADMIN_BEARER_TOKEN` is set
- `METRICS_BEARER_TOKEN` is set if metrics should not share the admin token
- `ALLOWED_ORIGINS` only includes browser origins that actually need cross-origin access
- `TRUST_PROXY=true` is only enabled behind a trusted proxy

## Filesystem

- the directory for `CUSTOMERS_CONFIG_PATH` exists and is writable
- the directory for `FEEDBACK_STORE_PATH` exists and is writable when using the file backend
- the process user can create temporary files next to `config/customers.json`

## Runtime Verification

- `npm run start:http` boots without warnings about missing config
- `GET /healthz` returns `ok`
- `GET /readyz` returns the expected customer count
- `GET /metrics` succeeds with the configured metrics bearer token
- `GET /admin/overview` succeeds with the configured admin bearer token
- admin responses echo `x-request-id`

## Operational Signals

- logs include `admin_customer_write_succeeded` for a known-good admin write
- logs include `admin_customer_write_failed` with `category` for a forced invalid write
- `/metrics` exposes `adminWrites`
- `/admin/overview` exposes `adminWriteSummary`

## Release Artifact

- `npm pack --dry-run` includes `config/customers.example.json`
- `npm pack --dry-run` includes `README.md`
- `npm pack --dry-run` includes `DEPLOYMENT.md`
- `npm pack --dry-run` includes `OPERATIONS.md`
