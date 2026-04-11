import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { feedbackStore } from "../feedback/feedback-store.js";
import { loadRuntimeConfig } from "../runtime/config.js";
import { registerPrompts } from "../prompts/prompt-registry.js";
import { registerResources } from "../resources/resource-registry.js";
import { registerTools } from "../tools/tool-registry.js";

function createServer() {
  const server = new McpServer({
    name: "open-lab-components",
    version: "0.2.0",
    websiteUrl: "https://github.com/itkdm/open-lab-components"
  });
  registerTools(server);
  registerPrompts(server);
  registerResources(server);

  return server;
}

async function initializeFeedbackRuntime(options = {}) {
  const runtime = {
    ...loadRuntimeConfig(options.env),
    ...options.runtime
  };
  await feedbackStore.configureBackend(runtime);
  await feedbackStore.configureDecay(runtime.feedbackHalfLifeDays);
  return runtime;
}

async function startStdioServer() {
  await initializeFeedbackRuntime();
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return { server, transport };
}

export { createServer, initializeFeedbackRuntime, startStdioServer };
