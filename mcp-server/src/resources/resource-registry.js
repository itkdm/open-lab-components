import { RESOURCE_DEFINITIONS } from "../core/catalog-registry.js";

function registerResources(server) {
  for (const definition of RESOURCE_DEFINITIONS) {
    server.registerResource(
      definition.name,
      definition.uri,
      {
        title: definition.title,
        description: definition.description,
        mimeType: definition.mimeType
      },
      definition.handler
    );
  }
}

export { registerResources };
