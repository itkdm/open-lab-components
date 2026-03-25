# MCP Server

Open Lab Components includes a read-only MCP server in `mcp-server/`.

For VIP customer hosting and HTTPS deployment, see [MCP_REMOTE.md](./MCP_REMOTE.md).

## Scope

The v1 server is intentionally narrow:

- `stdio` transport only
- read-only tools only
- no MCP resources
- no HTTP transport
- no remote hosting features

## Exposed tools

- `get_categories()`
- `list_components({ category?, tag?, hasEvents?, limit? })`
- `search_components({ query, category?, limit? })`
- `get_component({ id })`

`list_components` and `search_components` return summaries only.
`get_component` returns the full registry item plus HTML.

## Local development

Install the MCP package dependencies:

```bash
cd mcp-server
npm install
```

Run the server:

```bash
npm start
```

Or from the repo root:

```bash
npm run mcp:start
```

Run the MCP tests:

```bash
npm run mcp:test
```

## Client configuration

For local `stdio` clients such as Claude Desktop, point the client at:

- command: `node`
- args: absolute path to `mcp-server/src/cli.js`

Example:

```json
{
  "mcpServers": {
    "open-lab-components": {
      "command": "node",
      "args": [
        "/absolute/path/to/open-lab-components/mcp-server/src/cli.js"
      ]
    }
  }
}
```

## Publishing

This MCP server is intended to be published as a separate npm package:

- package: `@itkdm/open-lab-components-mcp`
- binary: `open-lab-components-mcp`
