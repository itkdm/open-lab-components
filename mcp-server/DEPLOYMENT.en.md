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
MCP_RUNTIME_HOME=/srv/open-lab-components-mcp
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

## 3. Create customer config

```bash
cp ./config/customers.example.json ./config/customers.json
npm run token:generate
```

## 4. Start the HTTP server

```bash
npm run start:http
```

## 5. Verify the deployment

```bash
curl http://127.0.0.1:3000/healthz
npm run smoke:remote
```

## Related Docs

- [中文部署说明](./DEPLOYMENT.zh-CN.md)
- [Deployment Checklist](./DEPLOYMENT-CHECKLIST.en.md)
- [Operations Guide](./OPERATIONS.en.md)
