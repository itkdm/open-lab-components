import test from "node:test";
import assert from "node:assert/strict";
import {
  getCategories,
  listComponents,
  searchComponents,
  getComponent
} from "../src/catalog.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lab = require("../../index.js");

test("get_categories returns counts that sum to registry count", () => {
  const categories = getCategories();
  const total = categories.reduce((sum, item) => sum + item.count, 0);

  assert.ok(categories.length > 0);
  assert.equal(total, lab.registry.count);
});

test("list_components filters by category and omits html", () => {
  const result = listComponents({ category: "physics/mechanics", limit: 5 });
  assert.ok(result.total > 0);
  assert.ok(result.items.length <= 5);
  for (const item of result.items) {
    assert.equal(item.category, "physics/mechanics");
    assert.equal(Object.prototype.hasOwnProperty.call(item, "html"), false);
  }
});

test("list_components filters hasEvents deterministically", () => {
  const withEvents = listComponents({ hasEvents: true, limit: 10 });
  assert.ok(withEvents.items.length > 0);
  for (const item of withEvents.items) {
    assert.equal(item.hasEvents, true);
    assert.ok(item.eventCount > 0);
  }
});

test("search_components ranks exact id matches first", () => {
  const result = searchComponents({ query: "phy.mechanics.projectile.interactive", limit: 5 });
  assert.ok(result.items.length > 0);
  assert.equal(result.items[0].id, "phy.mechanics.projectile.interactive");
  assert.equal(result.items[0].matchReason, "exact id");
});

test("search_components rejects empty query", () => {
  assert.throws(() => searchComponents({ query: "" }), /query is required/);
});

test("get_component returns full html and registry fields", () => {
  const result = getComponent("phy.mechanics.projectile.interactive");
  assert.equal(result.component.id, "phy.mechanics.projectile.interactive");
  assert.match(result.component.html, /data-cmp-id="phy\.mechanics\.projectile\.interactive"/);
  assert.equal(typeof result.component.sourcePath, "string");
  assert.equal(result.component.sourcePath.includes("\\"), false);
});

test("get_component unknown id returns suggestions metadata", () => {
  assert.throws(
    () => getComponent("phy.mechanics.projectile.missing"),
    (error) => {
      assert.equal(error.code, "COMPONENT_NOT_FOUND");
      assert.equal(error.data.id, "phy.mechanics.projectile.missing");
      assert.ok(Array.isArray(error.data.suggestions));
      assert.ok(error.data.suggestions.length <= 5);
      return true;
    }
  );
});
