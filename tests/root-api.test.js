"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const lab = require("../index.js");

const SAMPLE_ID = "phy.power.battery.basic";
const SAMPLE_CATEGORY = "physics/circuit";

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

  await run("list returns localized items and supports category filter", () => {
    const allItems = lab.list();
    const filteredItems = lab.list({ category: SAMPLE_CATEGORY });
    const englishItems = lab.list({ category: SAMPLE_CATEGORY }, { locale: "en" });

    assert.equal(allItems.length, lab.registry.count);
    assert.ok(filteredItems.length > 0);
    assert.ok(filteredItems.every((item) => item.category === SAMPLE_CATEGORY));
    assert.ok(englishItems.every((item) => item.category === SAMPLE_CATEGORY));
    assert.ok(englishItems.some((item) => item.id === SAMPLE_ID && item.name === "Dry Cell Battery"));
  });

  await run("get returns a localized manifest and null for unknown ids", () => {
    const zhComponent = lab.get(SAMPLE_ID);
    const enComponent = lab.get(SAMPLE_ID, { locale: "en-US" });

    assert.ok(zhComponent);
    assert.ok(enComponent);
    assert.equal(enComponent.id, SAMPLE_ID);
    assert.equal(enComponent.name, "Dry Cell Battery");
    assert.equal(enComponent.nameEn, "Dry Cell Battery");
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
    const expectedSuffix = path.join("components", "physics", "circuit", "phy.power.battery.basic.html");

    assert.ok(path.isAbsolute(resolvedPath));
    assert.ok(fs.existsSync(resolvedPath));
    assert.ok(resolvedPath.endsWith(expectedSuffix));
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
