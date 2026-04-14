import { PROMPT_DEFINITIONS } from "../core/catalog-registry.js";

function registerPrompts(server) {
  for (const definition of PROMPT_DEFINITIONS) {
    server.registerPrompt(
      definition.name,
      {
        title: definition.title,
        description: definition.description,
        argsSchema: definition.argsSchema
      },
      definition.handler
    );
  }
}

export { registerPrompts };
