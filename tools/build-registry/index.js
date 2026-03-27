const fs = require("fs");
const path = require("path");

const parse5 = require("parse5");

const { walkDir } = require("../_lib/walk");
const { extractManifest } = require("../_lib/manifest");
const { projectRootFrom, toPosixRel } = require("../_lib/paths");
const {
  BILINGUAL_SAMPLE_IDS,
  DEFAULT_LOCALE,
  LEGACY_SCHEMA,
  LOCALIZED_SCHEMA,
  SUPPORTED_LOCALES,
  localizeRegistryItem,
  normalizeCategoryNames,
  normalizeLocales
} = require("../../lib/i18n");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isElementNode(n) {
  return n && n.nodeName && n.tagName;
}

function getAttr(node, name) {
  const a = (node.attrs || []).find((x) => x.name === name);
  return a ? a.value : null;
}

function getRootAttrs(raw) {
  const fragment = parse5.parseFragment(raw.replace(/^\uFEFF/, ""));
  const elementNodes = (fragment.childNodes || []).filter(isElementNode);
  for (const node of elementNodes) {
    if ((getAttr(node, "class") || "").split(/\s+/).includes("cmp")) {
      return {
        ariaLabel: getAttr(node, "aria-label") || ""
      };
    }
  }
  return { ariaLabel: "" };
}

function loadCategoryNames(registryDir) {
  const categoryNamesPath = path.join(registryDir, "category-names.json");
  if (!fs.existsSync(categoryNamesPath)) return {};
  try {
    return normalizeCategoryNames(JSON.parse(fs.readFileSync(categoryNamesPath, "utf8")));
  } catch (err) {
    return {};
  }
}

function createCoverageReport(items) {
  const perLocale = {};
  for (const locale of SUPPORTED_LOCALES) {
    perLocale[locale] = 0;
  }

  let bilingualSamplesComplete = 0;
  const sampleDetails = [];

  for (const item of items) {
    for (const locale of SUPPORTED_LOCALES) {
      const localeData = item.locales && item.locales[locale];
      if (localeData && localeData.name && localeData.ariaLabel) {
        perLocale[locale] += 1;
      }
    }

    if (BILINGUAL_SAMPLE_IDS.includes(item.id)) {
      const sampleOk = !!(
        item.locales &&
        item.locales["zh-CN"] &&
        item.locales["zh-CN"].name &&
        item.locales["zh-CN"].ariaLabel &&
        item.locales.en &&
        item.locales.en.name &&
        item.locales.en.ariaLabel
      );
      if (sampleOk) bilingualSamplesComplete += 1;
      sampleDetails.push({
        id: item.id,
        hasZhCN: !!(item.locales && item.locales["zh-CN"] && item.locales["zh-CN"].name),
        hasEn: !!(item.locales && item.locales.en && item.locales.en.name),
        complete: sampleOk
      });
    }
  }

  return {
    schema: "cmp-i18n-report/v1",
    generatedAt: new Date().toISOString(),
    defaultLocale: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES,
    count: items.length,
    coverage: Object.fromEntries(
      Object.entries(perLocale).map(([locale, count]) => [
        locale,
        {
          count,
          ratio: items.length ? Number((count / items.length).toFixed(4)) : 0
        }
      ])
    ),
    bilingualSamples: {
      required: BILINGUAL_SAMPLE_IDS.length,
      complete: bilingualSamplesComplete,
      details: sampleDetails
    }
  };
}

function buildTags(items, locale) {
  const tagCount = new Map();
  for (const localized of items.map((item) => localizeRegistryItem(item, locale))) {
    for (const tag of localized.tags || []) {
      const key = String(tag).trim();
      if (!key) continue;
      tagCount.set(key, (tagCount.get(key) || 0) + 1);
    }
  }

  return {
    schema: "cmp-tags/v2",
    generatedAt: new Date().toISOString(),
    locale,
    tags: Array.from(tagCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0], locale === "zh-CN" ? "zh-Hans-CN" : "en"))
      .map(([tag, count]) => ({ tag, count }))
  };
}

function buildCategories(items, locale, categoryNames) {
  const catMap = new Map();
  for (const item of items) {
    const [subject, domain] = String(item.category || "").split("/");
    if (!subject || !domain) continue;
    if (!catMap.has(subject)) catMap.set(subject, new Map());
    const domains = catMap.get(subject);
    domains.set(domain, (domains.get(domain) || 0) + 1);
  }

  return {
    schema: "cmp-categories/v2",
    generatedAt: new Date().toISOString(),
    locale,
    subjects: Array.from(catMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "en"))
      .map(([subject, domains]) => ({
        subject,
        domains: Array.from(domains.entries())
          .sort((a, b) => a[0].localeCompare(b[0], "en"))
          .map(([domain, count]) => {
            const fullCategory = `${subject}/${domain}`;
            const info = categoryNames[fullCategory] || { locales: {} };
            return {
              domain,
              count,
              name: info.locales[locale] || info.locales[DEFAULT_LOCALE] || info.name || fullCategory,
              locales: info.locales || {}
            };
          })
      }))
  };
}

function main() {
  const root = projectRootFrom(__dirname);
  const componentsDir = path.join(root, "components");
  const registryDir = path.join(root, "registry");

  ensureDir(registryDir);

  const categoryNames = loadCategoryNames(registryDir);
  const files = walkDir(componentsDir, { filterFile: (p) => p.toLowerCase().endsWith(".html") });
  const byId = new Map();
  const items = [];
  const warnings = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { manifest } = extractManifest(raw, { filePath });
    const rootAttrs = getRootAttrs(raw);

    const id = manifest && manifest.id;
    if (!id || typeof id !== "string") throw new Error(`manifest.id missing: ${filePath}`);
    if (byId.has(id)) {
      throw new Error(`Duplicate id "${id}":\n- ${byId.get(id)}\n- ${filePath}`);
    }
    byId.set(id, filePath);

    const locales = normalizeLocales(manifest, rootAttrs.ariaLabel);
    const categoryInfo = categoryNames[manifest.category || ""] || { locales: {} };

    if (manifest.schema === LEGACY_SCHEMA) {
      warnings.push(`legacy manifest schema detected: ${toPosixRel(root, filePath)}`);
    }
    if (!locales["zh-CN"] || !locales["zh-CN"].name) {
      throw new Error(`missing zh-CN locale content: ${filePath}`);
    }
    if (!locales["zh-CN"].ariaLabel) {
      throw new Error(`missing zh-CN ariaLabel: ${filePath}`);
    }
    if (BILINGUAL_SAMPLE_IDS.includes(id) && (!locales.en || !locales.en.name || !locales.en.ariaLabel)) {
      warnings.push(`sample component missing English locale: ${toPosixRel(root, filePath)}`);
    } else if (!locales.en || !locales.en.name) {
      warnings.push(`component missing English locale fallback: ${toPosixRel(root, filePath)}`);
    }

    items.push({
      schema: manifest.schema === LOCALIZED_SCHEMA ? LOCALIZED_SCHEMA : LEGACY_SCHEMA,
      normalizedSchema: LOCALIZED_SCHEMA,
      id: manifest.id,
      name: locales["zh-CN"].name,
      nameEn: (locales.en && locales.en.name) || locales["zh-CN"].name,
      ariaLabel: locales["zh-CN"].ariaLabel,
      category: manifest.category || "",
      categoryName: categoryInfo.locales[DEFAULT_LOCALE] || categoryInfo.name || manifest.category || "",
      categoryNameEn: categoryInfo.locales.en || categoryInfo.nameEn || categoryInfo.name || manifest.category || "",
      categoryLocales: categoryInfo.locales || {},
      version: manifest.version,
      viewport: manifest.viewport,
      tags: locales["zh-CN"].tags || [],
      props: Array.isArray(manifest.props) ? manifest.props : [],
      cssVars: manifest.cssVars || {},
      events: Array.isArray(manifest.events) ? manifest.events : [],
      locales,
      sourcePath: toPosixRel(root, filePath)
    });
  }

  items.sort((a, b) => {
    const ca = String(a.category || "").localeCompare(String(b.category || ""), "zh-Hans-CN");
    if (ca) return ca;
    return String(a.id || "").localeCompare(String(b.id || ""), "en");
  });

  const generatedAt = new Date().toISOString();
  const rawRegistry = {
    schema: "cmp-registry/v2",
    generatedAt,
    defaultLocale: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES,
    count: items.length,
    items
  };
  fs.writeFileSync(path.join(registryDir, "registry.json"), JSON.stringify(rawRegistry, null, 2), "utf8");

  for (const locale of SUPPORTED_LOCALES) {
    const localizedRegistry = {
      schema: "cmp-registry/v2",
      generatedAt,
      defaultLocale: DEFAULT_LOCALE,
      locale,
      locales: SUPPORTED_LOCALES,
      count: items.length,
      items: items.map((item) => localizeRegistryItem(item, locale))
    };
    fs.writeFileSync(
      path.join(registryDir, `registry.${locale}.json`),
      JSON.stringify(localizedRegistry, null, 2),
      "utf8"
    );

    fs.writeFileSync(
      path.join(registryDir, `categories.${locale}.json`),
      JSON.stringify(buildCategories(items, locale, categoryNames), null, 2),
      "utf8"
    );

    fs.writeFileSync(
      path.join(registryDir, `tags.${locale}.json`),
      JSON.stringify(buildTags(items, locale), null, 2),
      "utf8"
    );
  }

  const defaultCategories = buildCategories(items, DEFAULT_LOCALE, categoryNames);
  const defaultTags = buildTags(items, DEFAULT_LOCALE);
  fs.writeFileSync(path.join(registryDir, "categories.json"), JSON.stringify(defaultCategories, null, 2), "utf8");
  fs.writeFileSync(path.join(registryDir, "tags.json"), JSON.stringify(defaultTags, null, 2), "utf8");

  const report = createCoverageReport(items);
  report.generatedAt = generatedAt;
  report.warnings = warnings;
  fs.writeFileSync(path.join(registryDir, "i18n-report.json"), JSON.stringify(report, null, 2), "utf8");

  if (warnings.length) {
    console.warn(`[build-registry] ${warnings.length} warning(s)`);
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
}

main();
