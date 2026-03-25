# Remote MCP Deployment

Open Lab Components can be deployed as a remote MCP service for VIP customers through the `mcp-server/` package.

## Runtime

- Node.js 18+
- single Linux server
- Nginx reverse proxy
- Node process managed by `systemd` or PM2

## Remote mode

The remote server uses:

- MCP `Streamable HTTP`
- bearer token authentication
- config-file customer registry
- in-memory per-customer rate limiting
- structured JSON logs

Entrypoint:

```bash
cd mcp-server
npm run start:http
```

Or from the repo root:

```bash
npm run mcp:start:http
```

## Required configuration

Environment variables:

- `HOST`
- `PORT`
- `CUSTOMERS_CONFIG_PATH`
- `LOG_LEVEL`
- `ALLOWED_HOSTS`
- `TRUST_PROXY`

Example:

```bash
HOST=127.0.0.1
PORT=3000
CUSTOMERS_CONFIG_PATH=/srv/open-lab-components/customers.json
LOG_LEVEL=info
ALLOWED_HOSTS=mcp.example.com
TRUST_PROXY=true
```

## Customer config

Copy the example file:

```bash
cp mcp-server/config/customers.example.json /srv/open-lab-components/customers.json
```

Generate a new token:

```bash
cd mcp-server
npm run token:generate
```

Store only the emitted `tokenHash` in config. Send the raw token to the VIP customer through your normal secure channel.

## Endpoints

- MCP endpoint: `/mcp`
- health check: `/healthz`

## Nginx example

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate     /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location /mcp {
        proxy_pass http://127.0.0.1:3000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600;
        proxy_send_timeout 3600;
    }

    location /healthz {
        proxy_pass http://127.0.0.1:3000/healthz;
        proxy_set_header Host $host;
    }
}
```

## systemd example

```ini
[Unit]
Description=Open Lab Components Remote MCP Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/open-lab-components/mcp-server
Environment=HOST=127.0.0.1
Environment=PORT=3000
Environment=CUSTOMERS_CONFIG_PATH=/srv/open-lab-components/customers.json
Environment=LOG_LEVEL=info
Environment=ALLOWED_HOSTS=mcp.example.com
Environment=TRUST_PROXY=true
ExecStart=/usr/bin/node /srv/open-lab-components/mcp-server/src/http-cli.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Verification

Run:

```bash
npm run mcp:test
npm run mcp:test:remote
```

Then verify:

- `GET /healthz` returns `200`
- valid bearer token can connect to `/mcp`
- invalid token gets `401`
- disabled or expired token gets `403`
- repeated tool calls hit `429`
