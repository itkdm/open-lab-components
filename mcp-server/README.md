# Open Lab Components MCP Server

Locale-aware MCP server for discovering and retrieving components from the Open Lab Components library.

This package supports:

- local `stdio` mode for VS Code and local MCP clients
- remote `Streamable HTTP` mode for hosted access
- locale-aware summaries and component lookup

## What it exposes

The v1 server exposes these tools over `stdio`:

- `get_categories`
- `list_components`
- `search_components`
- `get_component`

All public tools accept an optional `locale` parameter.

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

Returns filtered component summaries resolved for the requested locale. It never returns HTML.

### `search_components`

Runs deterministic lexical matching over ids, names, tags, and category metadata across supported locales.

### `get_component`

Returns a full registry item plus complete HTML for a single component id.

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
