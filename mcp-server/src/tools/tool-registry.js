import { TOOL_DEFINITIONS, jsonResponse } from "../core/catalog-registry.js";

function registerTools(server) {
  for (const definition of TOOL_DEFINITIONS) {
    server.registerTool(
      definition.name,
      {
        title: definition.title,
        description: definition.description,
        inputSchema: definition.inputSchema
      },
      definition.handler
    );
  }
}

export { jsonResponse, registerTools };
