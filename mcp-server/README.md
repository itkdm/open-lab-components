# Open Lab Components MCP Server

Read-only MCP server for discovering and retrieving components from the Open Lab Components library.

This package now supports:

- local `stdio` mode for VS Code and local MCP clients
- remote `Streamable HTTP` mode for hosted VIP access

## What it exposes

The v1 server exposes these tools over `stdio`:

- `get_categories`
- `list_components`
- `search_components`
- `get_component`

This release is intentionally read-only. It does not create, edit, or validate components through MCP.

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

## Remote HTTP usage

Create a customer config file from the example:

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

Environment variables:

- `HOST`
- `PORT`
- `CUSTOMERS_CONFIG_PATH`
- `LOG_LEVEL`
- `ALLOWED_HOSTS`
- `TRUST_PROXY`

## Claude Desktop example

Use the published binary or a local repo checkout. Example local command:

```json
{
  "mcpServers": {
    "open-lab-components": {
      "command": "node",
      "args": [
        "D:/develop/project/edu-html/组件库/open-lab-components/mcp-server/src/cli.js"
      ]
    }
  }
}
```

## Tool behavior

### `get_categories`

Returns all categories with localized names and component counts.

### `list_components`

Returns filtered component summaries. It never returns HTML.

### `search_components`

Runs deterministic lexical matching over ids, names, tags, and category metadata.

### `get_component`

Returns a full registry item plus complete HTML for a single component id.

## Remote deployment

See [`../docs/MCP_REMOTE.md`](../docs/MCP_REMOTE.md) for Nginx, HTTPS, customer config, and Linux service guidance.
