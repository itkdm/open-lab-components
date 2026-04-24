const fs = require("fs");
const path = require("path");

const { projectRootFrom, toPosixRel } = require("../_lib/paths");
const { walkDir } = require("../_lib/walk");
const { SUPPORTED_LOCALES, DEFAULT_LOCALE, normalizeLocale, resolveLocaleEntry } = require("../../lib/i18n");
const visualMetadata = require("../../lib/visual-registry-metadata");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pruneGeneratedVisualRegistryFiles(registryDir) {
  const expected = new Set(visualMetadata.listGeneratedVisualRegistryFiles(SUPPORTED_LOCALES));
  const sourceFiles = new Set(visualMetadata.VISUAL_SOURCE_FILES);

  for (const entry of fs.readdirSync(registryDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (sourceFiles.has(entry.name)) continue;
    if (!expected.has(entry.name)) continue;
    fs.rmSync(path.join(registryDir, entry.name), { force: true });
  }
}

function ensureArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function localizeVisual(item, locale) {
  const localized = resolveLocaleEntry(item.locales, locale);
  const english = resolveLocaleEntry(item.locales, "en");
  return {
    ...item,
    title: localized.title || item.title || item.id,
    titleEn: english.title || item.titleEn || item.title || item.id,
    summary: localized.summary || item.summary || "",
    summaryEn: english.summary || item.summaryEn || item.summary || "",
    aiPrompt: localized.prompt || item.aiPrompt || "",
    aiPromptEn: english.prompt || item.aiPromptEn || item.aiPrompt || "",
    tags: Array.isArray(localized.tags) && localized.tags.length
      ? localized.tags.slice()
      : ensureArray(item.tags)
  };
}

function buildSubjects(items, locale) {
  const bySubject = new Map();
  for (const item of items) {
    const current = bySubject.get(item.subject) || {
      subject: item.subject,
      count: 0,
      topics: new Set(),
      types: new Set()
    };
    current.count += 1;
    current.topics.add(item.topic);
    current.types.add(item.type);
    bySubject.set(item.subject, current);
  }

  return {
    schema: "olc-visual-subjects/v1",
    generatedAt: new Date().toISOString(),
    locale,
    subjects: Array.from(bySubject.values())
      .sort((a, b) => a.subject.localeCompare(b.subject))
      .map((entry) => ({
        subject: entry.subject,
        count: entry.count,
        topics: Array.from(entry.topics).sort(),
        types: Array.from(entry.types).sort()
      }))
  };
}

function buildTags(items, locale) {
  const counts = new Map();
  for (const item of items.map((entry) => localizeVisual(entry, locale))) {
    for (const tag of ensureArray(item.tags)) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return {
    schema: "olc-visual-tags/v1",
    generatedAt: new Date().toISOString(),
    locale,
    tags: Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], locale === "zh-CN" ? "zh-Hans-CN" : "en"))
      .map(([tag, count]) => ({ tag, count }))
  };
}

function main() {
  const root = projectRootFrom(__dirname);
  const visualsDir = path.join(root, "visuals");
  const registryDir = path.join(root, "registry");

  ensureDir(registryDir);
  if (!fs.existsSync(visualsDir)) return;
  pruneGeneratedVisualRegistryFiles(registryDir);

  const files = walkDir(visualsDir, {
    filterFile: (filePath) => filePath.toLowerCase().endsWith(".json")
  });
  const items = [];
  const byId = new Map();

  for (const filePath of files) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const id = String(raw.id || "").trim();
    if (!id) throw new Error(`visual id missing: ${filePath}`);
    if (byId.has(id)) {
      throw new Error(`Duplicate visual id "${id}":\n- ${byId.get(id)}\n- ${filePath}`);
    }
    byId.set(id, filePath);

    const assetRel = toPosixRel(root, path.join(path.dirname(filePath), raw.asset || ""));
    const thumbnailRel = toPosixRel(root, path.join(path.dirname(filePath), raw.thumbnail || raw.asset || ""));
    if (!fs.existsSync(path.join(root, assetRel))) {
      throw new Error(`visual asset missing for ${id}: ${assetRel}`);
    }

    const locales = {};
    for (const [localeKey, localeData] of Object.entries(raw.locales || {})) {
      const locale = normalizeLocale(localeKey);
      locales[locale] = {
        title: String(localeData.title || "").trim(),
        summary: String(localeData.summary || "").trim(),
        prompt: String(localeData.prompt || "").trim(),
        tags: ensureArray(localeData.tags).map((tag) => String(tag).trim()).filter(Boolean)
      };
    }

    if (!locales[DEFAULT_LOCALE] || !locales[DEFAULT_LOCALE].title) {
      throw new Error(`visual missing ${DEFAULT_LOCALE} title: ${filePath}`);
    }
    if (!locales[DEFAULT_LOCALE].prompt) {
      throw new Error(`visual missing ${DEFAULT_LOCALE} prompt: ${filePath}`);
    }

    const defaultLocale = locales[DEFAULT_LOCALE];
    const english = resolveLocaleEntry(locales, "en");
    items.push({
      schema: String(raw.schema || "olc-visual/v1"),
      id,
      subject: String(raw.subject || "").trim(),
      topic: String(raw.topic || "").trim(),
      type: String(raw.type || "").trim(),
      version: String(raw.version || "0.1.0").trim(),
      format: String(raw.format || "image/svg+xml").trim(),
      title: defaultLocale.title,
      titleEn: english.title || defaultLocale.title,
      summary: defaultLocale.summary,
      summaryEn: english.summary || defaultLocale.summary,
      aiPrompt: defaultLocale.prompt,
      aiPromptEn: english.prompt || defaultLocale.prompt,
      tags: defaultLocale.tags,
      gradeRange: ensureArray(raw.gradeRange).map((item) => String(item).trim()).filter(Boolean),
      relatedComponents: ensureArray(raw.relatedComponents).map((item) => String(item).trim()).filter(Boolean),
      size: raw.size && typeof raw.size === "object" ? raw.size : null,
      locales,
      sourcePath: toPosixRel(root, filePath),
      assetPath: assetRel,
      thumbnailPath: thumbnailRel
    });
  }

  items.sort((a, b) => a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id));
  const generatedAt = new Date().toISOString();
  const registryPayload = {
    schema: "olc-visual-registry/v1",
    generatedAt,
    defaultLocale: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES,
    count: items.length,
    items
  };

  fs.writeFileSync(
    path.join(registryDir, visualMetadata.DEFAULT_VISUAL_REGISTRY_FILE),
    JSON.stringify(registryPayload, null, 2),
    "utf8"
  );

  for (const locale of SUPPORTED_LOCALES) {
    fs.writeFileSync(
      path.join(registryDir, visualMetadata.getLocalizedVisualRegistryFile(locale)),
      JSON.stringify(
        {
          schema: registryPayload.schema,
          generatedAt,
          defaultLocale: DEFAULT_LOCALE,
          locale,
          locales: SUPPORTED_LOCALES,
          count: items.length,
          items: items.map((item) => localizeVisual(item, locale))
        },
        null,
        2
      ),
      "utf8"
    );

    fs.writeFileSync(
      path.join(registryDir, visualMetadata.getLocalizedVisualSubjectsFile(locale)),
      JSON.stringify(buildSubjects(items, locale), null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(registryDir, visualMetadata.getLocalizedVisualTagsFile(locale)),
      JSON.stringify(buildTags(items, locale), null, 2),
      "utf8"
    );
  }

  fs.writeFileSync(
    path.join(registryDir, visualMetadata.VISUAL_SUBJECTS_FILE),
    JSON.stringify(buildSubjects(items, DEFAULT_LOCALE), null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(registryDir, visualMetadata.VISUAL_TAGS_FILE),
    JSON.stringify(buildTags(items, DEFAULT_LOCALE), null, 2),
    "utf8"
  );
}

module.exports = { main };
