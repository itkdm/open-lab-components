# MCP Package Maintenance

This package exposes the Open Lab Components catalog through local and remote
MCP transports.

## Maintenance Notes

- Keep package scripts aligned with `mcp-server/tools/check-scripts.mjs`.
- Treat component source files as read-only from the MCP server.
- Keep runtime configuration examples in `config/` and deployment examples in
  `deploy/`.
- Run `npm run mcp:check:docs`, `npm run mcp:check:scripts`, and
  `npm run mcp:test` after changing MCP package behavior.
