const fs = require("fs");
const path = require("path");

const { walkDir } = require("../_lib/walk");
const { extractManifest } = require("../_lib/manifest");
const { projectRootFrom } = require("../_lib/paths");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function main() {
  const root = projectRootFrom(__dirname);
  const registryPath = path.join(root, "registry", "registry.json");

  const raw = fs.readFileSync(registryPath, "utf8");
  const registry = JSON.parse(raw);
  const lib = require(path.join(root, "index.js"));

  if (!registry || !Array.isArray(registry.items)) {
    return fail("registry.json must contain an items array");
  }
  if (!lib.registry || !Array.isArray(lib.registry.items)) {
    return fail("library registry export must contain an items array");
  }
  if (registry.items.length !== lib.registry.items.length) {
    return fail("registry.json and library registry export item counts do not match");
  }

  const requiredKeys = [
    "schema",
    "id",
    "name",
    "nameEn",
    "category",
    "categoryName",
    "categoryNameEn",
    "version",
    "viewport",
    "tags",
    "props",
    "cssVars",
    "sourcePath"
  ];

  registry.items.forEach((item) => {
    requiredKeys.forEach((key) => {
      if (!(key in item)) {
        fail(`registry item ${item.id || "<unknown>"} missing required key: ${key}`);
      }
    });
  });

  const itemsById = new Map(registry.items.map((item) => [item.id, item]));
  const componentFiles = walkDir(path.join(root, "components"), {
    filterFile: (p) => p.toLowerCase().endsWith(".html")
  });

  componentFiles.forEach((filePath) => {
    const rawHtml = fs.readFileSync(filePath, "utf8");
    const manifest = extractManifest(rawHtml, { filePath }).manifest;
    const item = itemsById.get(manifest.id);
    if (!item) {
      fail(`registry item missing for manifest id: ${manifest.id}`);
      return;
    }
    const hasManifestEvents = Array.isArray(manifest.events);
    const hasRegistryEvents = Array.isArray(item.events);
    if (hasManifestEvents !== hasRegistryEvents) {
      fail(`registry events mismatch for component: ${manifest.id}`);
      return;
    }
  });
}

main();
