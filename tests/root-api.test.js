"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const lab = require("../index.js");
const registryLib = require("../lib/registry.js");
const visualRegistryLib = require("../lib/visual-registry.js");
const {
  ROOT_API_EXPORTS,
  ROOT_API_TYPE_SNIPPETS,
  ROOT_QUERY_API_CONTRACT
} = require("../lib/root-api-metadata.js");

const SAMPLE_ID = ROOT_QUERY_API_CONTRACT.sampleId;
const SAMPLE_CATEGORY = ROOT_QUERY_API_CONTRACT.sampleCategory;
const SAMPLE_VISUAL_ID = ROOT_QUERY_API_CONTRACT.sampleVisualId;

function run(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(() => {
        console.log(`ok - ${name}`);
      });
    }
    console.log(`ok - ${name}`);
    return Promise.resolve();
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

async function main() {
  await run("registry export is internally consistent", () => {
  assert.equal(lab.registry.schema, "cmp-registry/v2");
  assert.equal(lab.registry.count, lab.registry.items.length);
  assert.ok(lab.registry.items.length > 200);
  });

  await run("root api exports and type declarations stay on the shared contract", () => {
    const exportedKeys = Object.keys(lab).sort();
    const expectedKeys = ROOT_API_EXPORTS.slice().sort();
    const typeSource = fs.readFileSync(path.join(__dirname, "..", "index.d.ts"), "utf8");

    assert.deepEqual(exportedKeys, expectedKeys);
    for (const snippet of ROOT_API_TYPE_SNIPPETS) {
      assert.match(typeSource, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  await run("list returns localized items and supports category filter", () => {
    const allItems = lab.list();
    const filteredItems = lab.list({ category: SAMPLE_CATEGORY });
    const englishItems = lab.list({ category: SAMPLE_CATEGORY }, { locale: "en" });

    assert.equal(allItems.length, lab.registry.count);
    assert.ok(filteredItems.length > 0);
    assert.ok(filteredItems.every((item) => item.category === SAMPLE_CATEGORY));
    assert.ok(englishItems.every((item) => item.category === SAMPLE_CATEGORY));
    assert.ok(
      englishItems.some(
        (item) =>
          item.id === SAMPLE_ID && item.name === ROOT_QUERY_API_CONTRACT.sampleEnglishName
      )
    );
  });

  await run("get returns a localized manifest and null for unknown ids", () => {
    const zhComponent = lab.get(SAMPLE_ID);
    const enComponent = lab.get(SAMPLE_ID, { locale: "en-US" });

    assert.ok(zhComponent);
    assert.ok(enComponent);
    assert.equal(enComponent.id, SAMPLE_ID);
    assert.equal(enComponent.name, ROOT_QUERY_API_CONTRACT.sampleEnglishName);
    assert.equal(enComponent.nameEn, ROOT_QUERY_API_CONTRACT.sampleEnglishName);
    assert.notEqual(zhComponent.name, "");
    assert.equal(lab.get("does.not.exist"), null);
  });

  await run("categories exposes unique category ids including the sample category", () => {
    const categories = lab.categories();

    assert.ok(categories.includes(SAMPLE_CATEGORY));
    assert.equal(new Set(categories).size, categories.length);
  });

  await run("readSync and read return component html", async () => {
    const syncHtml = lab.readSync(SAMPLE_ID);
    const asyncHtml = await lab.read(SAMPLE_ID);

    assert.match(syncHtml, new RegExp(`data-cmp-id="${SAMPLE_ID.replace(/\./g, "\\.")}"`));
    assert.equal(asyncHtml, syncHtml);
  });

  await run("resolve returns an existing component file path", () => {
    const resolvedPath = lab.resolve(SAMPLE_ID);
    const expectedSuffix = path.join(...ROOT_QUERY_API_CONTRACT.sampleResolvedSuffix);

    assert.ok(path.isAbsolute(resolvedPath));
    assert.ok(fs.existsSync(resolvedPath));
    assert.ok(resolvedPath.endsWith(expectedSuffix));
  });

  await run("visuals support shared taxonomy and localized file access", async () => {
    const taxonomy = lab.visuals.taxonomy("en");

    assert.equal(lab.visuals.registry.schema, "olc-visual-registry/v1");
    assert.equal(taxonomy.subjects.physics, "Physics");
    assert.equal(taxonomy.types.flowchart, "Flowchart");
    assert.equal(lab.visuals.get("vis.missing.asset"), null);

    if (lab.visuals.registry.count === 0) {
      assert.deepEqual(lab.visuals.list(), []);
      assert.deepEqual(lab.visuals.subjects(), []);
      return;
    }

    const visual = lab.visuals.get(SAMPLE_VISUAL_ID, { locale: "en" });
    const visualRaw = lab.visuals.readSync(SAMPLE_VISUAL_ID);
    const visualRawAsync = await lab.visuals.read(SAMPLE_VISUAL_ID);
    const resolvedPath = lab.visuals.resolve(SAMPLE_VISUAL_ID);
    const expectedSuffix = path.join(...ROOT_QUERY_API_CONTRACT.sampleVisualResolvedSuffix);

    assert.ok(visual);
    assert.equal(visual.title, ROOT_QUERY_API_CONTRACT.sampleVisualEnglishTitle);
    assert.ok(Array.isArray(visual.tags) && visual.tags.length > 0);
    assert.ok(lab.visuals.subjects().includes("physics"));
    assert.ok(path.isAbsolute(resolvedPath));
    assert.ok(fs.existsSync(resolvedPath));
    assert.ok(resolvedPath.endsWith(expectedSuffix));
    assert.ok(visualRaw instanceof Uint8Array || Buffer.isBuffer(visualRaw));
    assert.equal(Buffer.compare(Buffer.from(visualRaw), Buffer.from(visualRawAsync)), 0);
  });

  await run("registry loader exposes a stable error when generated registry is missing", () => {
    const originalGetRegistry = registryLib.getRegistry;
    const originalRegistry = lab.registry;
    const originalGetVisualRegistry = visualRegistryLib.getRegistry;
    const originalVisualRegistry = lab.visuals.registry;

    registryLib.getRegistry = function () {
      throw registryLib.createRegistryMissingError();
    };
    visualRegistryLib.getRegistry = function () {
      throw visualRegistryLib.createVisualRegistryMissingError();
    };

    try {
      assert.throws(
        () => lab.list(),
        (error) => error && error.code === "REGISTRY_NOT_BUILT" && /build:registry/.test(error.message)
      );
      assert.throws(
        () => lab.visuals.list(),
        (error) => error && error.code === "VISUAL_REGISTRY_NOT_BUILT" && /build:registry/.test(error.message)
      );
    } finally {
      registryLib.getRegistry = originalGetRegistry;
      visualRegistryLib.getRegistry = originalGetVisualRegistry;
      registryLib.clearRegistryCache();
      visualRegistryLib.clearRegistryCache();
      // Re-prime cache so later callers see the real registry again.
      void originalRegistry;
      void originalVisualRegistry;
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
