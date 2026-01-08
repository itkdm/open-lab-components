const fs = require("fs");
const path = require("path");

const { walkDir } = require("../_lib/walk");
const { extractManifest } = require("../_lib/manifest");
const { projectRootFrom, toPosixRel } = require("../_lib/paths");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  const root = projectRootFrom(__dirname);
  const componentsDir = path.join(root, "components");
  const registryDir = path.join(root, "registry");

  ensureDir(registryDir);

  // 加载分类名称映射
  const categoryNamesPath = path.join(registryDir, "category-names.json");
  let categoryNames = {};
  if (fs.existsSync(categoryNamesPath)) {
    try {
      const categoryNamesData = JSON.parse(fs.readFileSync(categoryNamesPath, "utf8"));
      categoryNames = categoryNamesData.categories || {};
    } catch (err) {
      console.warn(`[build-registry] Failed to load category-names.json: ${err.message}`);
    }
  }

  const files = walkDir(componentsDir, { filterFile: (p) => p.toLowerCase().endsWith(".html") });

  const byId = new Map();
  const items = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { manifest } = extractManifest(raw, { filePath });

    const id = manifest?.id;
    if (!id || typeof id !== "string") throw new Error(`manifest.id missing: ${filePath}`);
    if (byId.has(id)) {
      throw new Error(`Duplicate id "${id}":\n- ${byId.get(id)}\n- ${filePath}`);
    }
    byId.set(id, filePath);

    const category = manifest.category || "";
    const categoryInfo = categoryNames[category] || {};
    
    items.push({
      schema: manifest.schema,
      id: manifest.id,
      name: manifest.name,
      nameEn: manifest.nameEn || null,
      category: category,
      categoryName: categoryInfo.name || category,
      categoryNameEn: categoryInfo.nameEn || category,
      version: manifest.version,
      viewport: manifest.viewport,
      tags: Array.isArray(manifest.tags) ? manifest.tags : [],
      props: Array.isArray(manifest.props) ? manifest.props : [],
      cssVars: manifest.cssVars || {},
      sourcePath: toPosixRel(root, filePath)
    });
  }

  items.sort((a, b) => {
    const ca = (a.category || "").localeCompare(b.category || "", "zh-Hans-CN");
    if (ca) return ca;
    return (a.id || "").localeCompare(b.id || "", "en");
  });

  const registry = {
    schema: "cmp-registry/v1",
    generatedAt: new Date().toISOString(),
    count: items.length,
    items
  };
  fs.writeFileSync(path.join(registryDir, "registry.json"), JSON.stringify(registry, null, 2), "utf8");

  // categories.json: simple tree + counts + names
  const catMap = new Map(); // subject -> domain -> count
  for (const it of items) {
    const c = String(it.category || "");
    const [subject, domain] = c.split("/");
    if (!subject || !domain) continue;
    if (!catMap.has(subject)) catMap.set(subject, new Map());
    const dom = catMap.get(subject);
    dom.set(domain, (dom.get(domain) || 0) + 1);
  }
  const categories = {
    schema: "cmp-categories/v1",
    generatedAt: registry.generatedAt,
    subjects: Array.from(catMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "en"))
      .map(([subject, dom]) => ({
        subject,
        domains: Array.from(dom.entries())
          .sort((a, b) => a[0].localeCompare(b[0], "en"))
          .map(([domain, count]) => {
            const fullCategory = `${subject}/${domain}`;
            const names = categoryNames[fullCategory] || {};
            return {
              domain,
              count,
              name: names.name || domain,
              nameEn: names.nameEn || domain
            };
          })
      }))
  };
  fs.writeFileSync(path.join(registryDir, "categories.json"), JSON.stringify(categories, null, 2), "utf8");

  // tags.json: tag -> count
  const tagCount = new Map();
  for (const it of items) {
    for (const t of it.tags || []) {
      const key = String(t).trim();
      if (!key) continue;
      tagCount.set(key, (tagCount.get(key) || 0) + 1);
    }
  }
  const tags = {
    schema: "cmp-tags/v1",
    generatedAt: registry.generatedAt,
    tags: Array.from(tagCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "en"))
      .map(([tag, count]) => ({ tag, count }))
  };
  fs.writeFileSync(path.join(registryDir, "tags.json"), JSON.stringify(tags, null, 2), "utf8");

  console.log(`[build-registry] ok: ${items.length} components`);
}

main();


