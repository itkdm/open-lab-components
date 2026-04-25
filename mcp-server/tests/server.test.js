import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const cliPath = path.resolve(repoRoot, "mcp-server", "src", "core", "cli.js");

async function withClient(run) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath],
    cwd: repoRoot,
    stderr: "pipe"
  });
  const client = new Client({
    name: "open-lab-components-mcp-test",
    version: "0.1.0"
  });

  try {
    await client.connect(transport);
    await run(client);
  } finally {
    await client.close();
  }
}

test("server boots over stdio and serves the v1 toolset", { concurrency: false }, async () => {
  await withClient(async (client) => {
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name).sort();

    assert.deepEqual(names, [
      "build_experiment_page",
      "compose_experiment_bundle",
      "get_categories",
      "get_component",
      "get_recommendation_feedback_stats",
      "get_visual",
      "list_components",
      "list_visuals",
      "recommend_components",
      "search_components",
      "search_visuals",
      "submit_recommendation_feedback",
      "validate_experiment_bundle"
    ]);

    const result = await client.callTool({
      name: "get_component",
      arguments: { id: "missing.component.id" }
    });

    assert.equal(result.isError, true);
    assert.equal(result.content[0].type, "text");
    assert.match(result.content[0].text, /Component not found/);

    const listResult = await client.callTool({
      name: "list_components",
      arguments: { category: "physics/mechanics", limit: 3, locale: "en" }
    });
    const payload = JSON.parse(listResult.content[0].text);

    assert.ok(Array.isArray(payload.items));
    assert.ok(payload.items.length <= 3);
    for (const item of payload.items) {
      assert.equal(item.category, "physics/mechanics");
    }

    const getResult = await client.callTool({
      name: "get_component",
      arguments: { id: "phy.resistor.axial.basic", locale: "en" }
    });
    const componentPayload = JSON.parse(getResult.content[0].text);
    assert.equal(componentPayload.component.name, "Axial Resistor");

    const visualResult = await client.callTool({
      name: "get_visual",
      arguments: { id: "vis.physics.series-circuit-flow", locale: "en" }
    });
    assert.equal(visualResult.isError, true);
    assert.match(visualResult.content[0].text, /Visual not found/);

    const resources = await client.listResources();
    assert.ok(resources.resources.length >= 5);
    assert.ok(resources.resources.some((resource) => resource.uri === "openlab://catalog/overview"));
    assert.ok(resources.resources.some((resource) => resource.uri === "openlab://catalog/interactive"));
    assert.ok(resources.resources.some((resource) => resource.uri === "openlab://catalog/lesson-ready"));
    assert.ok(resources.resources.some((resource) => resource.uri === "openlab://visuals/overview"));

    const resourcePayload = await client.readResource({ uri: "openlab://catalog/overview" });
    assert.match(resourcePayload.contents[0].text, /componentCount/);
    const interactiveResource = await client.readResource({ uri: "openlab://catalog/interactive" });
    assert.match(interactiveResource.contents[0].text, /qualitySummary/);
    assert.doesNotMatch(interactiveResource.contents[0].text, /data-cmp-id=/);
    const visualResource = await client.readResource({ uri: "openlab://visuals/overview" });
    assert.match(visualResource.contents[0].text, /visualCount/);

    const resourceTemplates = await client.listResourceTemplates();
    assert.ok(resourceTemplates.resourceTemplates.some((resource) => resource.uriTemplate === "openlab://catalog/subject/{subject}"));
    const subjectResource = await client.readResource({ uri: "openlab://catalog/subject/physics" });
    assert.match(subjectResource.contents[0].text, /\"subject\": \"physics\"/);

    const prompt = await client.getPrompt({
      name: "component-recommendation-brief",
      arguments: {
        subject: "physics",
        lessonGoal: "help teachers find suitable demonstration components",
        locale: "en"
      }
    });
    assert.equal(prompt.messages[0].role, "user");
    assert.match(prompt.messages[0].content.text, /physics/);

    const recommendResult = await client.callTool({
      name: "recommend_components",
      arguments: {
        subject: "physics",
        lessonGoal: "interactive resistor explanation",
        preferredCategories: ["physics/circuit"],
        mustIncludeTags: ["resistor"],
        locale: "en"
      }
    });
    const recommendPayload = JSON.parse(recommendResult.content[0].text);
    assert.ok(Array.isArray(recommendPayload.items));
    assert.ok(recommendPayload.items.length > 0);
    assert.ok(recommendPayload.items[0].recommendationScore > 0);

    const pagePlanResult = await client.callTool({
      name: "build_experiment_page",
      arguments: {
        subject: "physics",
        lessonGoal: "interactive resistor explanation",
        audience: "middle-school students",
        pageType: "lesson",
        preferredCategories: ["physics/circuit"],
        mustIncludeTags: ["resistor"],
        locale: "en"
      }
    });
    const pagePlanPayload = JSON.parse(pagePlanResult.content[0].text);
    assert.ok(Array.isArray(pagePlanPayload.sections));
    assert.ok(pagePlanPayload.sections.length > 0);
    assert.ok(Array.isArray(pagePlanPayload.assemblySteps));

    const bundleResult = await client.callTool({
      name: "compose_experiment_bundle",
      arguments: {
        subject: "physics",
        lessonGoal: "interactive resistor explanation",
        audience: "middle-school students",
        preferredCategories: ["physics/circuit"],
        mustIncludeTags: ["resistor"],
        locale: "en"
      }
    });
    const bundlePayload = JSON.parse(bundleResult.content[0].text);
    assert.ok(Array.isArray(bundlePayload.items));
    assert.ok(bundlePayload.items.length > 0);
    assert.match(bundlePayload.items[0].html, /data-cmp-id=/);

    const validationResult = await client.callTool({
      name: "validate_experiment_bundle",
      arguments: {
        items: bundlePayload.items,
        sections: pagePlanPayload.sections
      }
    });
    const validationPayload = JSON.parse(validationResult.content[0].text);
    assert.equal(typeof validationPayload.valid, "boolean");
    assert.ok(Array.isArray(validationPayload.issues));

    const feedbackResult = await client.callTool({
      name: "submit_recommendation_feedback",
      arguments: {
        componentId: "phy.resistor.axial.basic",
        customerId: "tenant-a",
        feedbackType: "selected",
        subject: "physics",
        lessonGoal: "interactive resistor explanation",
        preferredCategories: ["physics/circuit"]
      }
    });
    const feedbackPayload = JSON.parse(feedbackResult.content[0].text);
    assert.equal(feedbackPayload.feedback.componentId, "phy.resistor.axial.basic");

    const statsResult = await client.callTool({
      name: "get_recommendation_feedback_stats",
      arguments: {}
    });
    const statsPayload = JSON.parse(statsResult.content[0].text);
    assert.equal(statsPayload.feedback.tenantCount >= 1, true);
  });
});
