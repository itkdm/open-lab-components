"use strict";

const DEFAULT_LOCALE = "zh-CN";
const SUPPORTED_LOCALES = ["zh-CN", "en"];
const LEGACY_SCHEMA = "cmp-manifest/v1";
const LOCALIZED_SCHEMA = "cmp-manifest/v2";

const BILINGUAL_SAMPLE_IDS = [
  "phy.power.battery.basic",
  "phy.power.battery-pack.basic",
  "phy.resistor.axial.basic",
  "phy.switch.knife.basic",
  "phy.wire.clip.draggable",
  "phy.circuit.wire-connector.interactive",
  "phy.rheostat.slide.interactive",
  "phy.meter.current.basic",
  "phy.meter.voltage.draggable",
  "phy.optics.lens.convex.basic",
  "phy.optics.lens.convex.interactive",
  "phy.optics.mirror.plane.interactive",
  "phy.optics.refraction.interactive",
  "math.function.graph.interactive",
  "math.trigonometry.unit-circle.interactive",
  "math.number.number-line.interactive",
  "bio.cell.animal.basic",
  "bio.cell.plant.basic",
  "bio.cell.dna.interactive",
  "bio.instrument.microscope.basic"
];

function deepClone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeLocale(locale) {
  if (!locale) return DEFAULT_LOCALE;
  const raw = String(locale).trim();
  if (!raw) return DEFAULT_LOCALE;
  if (raw === "zh") return "zh-CN";
  if (raw.toLowerCase() === "zh-cn") return "zh-CN";
  if (raw.toLowerCase() === "en-us" || raw.toLowerCase() === "en-gb") return "en";
  if (raw.toLowerCase() === "en") return "en";
  return raw;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeLocalizedProps(props) {
  if (!props) return {};
  if (Array.isArray(props)) {
    const map = {};
    for (const item of props) {
      if (!item || typeof item !== "object" || !isNonEmptyString(item.key)) continue;
      map[item.key] = {
        label: isNonEmptyString(item.label) ? item.label : undefined,
        desc: isNonEmptyString(item.desc) ? item.desc : undefined,
        category: isNonEmptyString(item.category) ? item.category : undefined
      };
    }
    return map;
  }
  if (typeof props === "object") return deepClone(props);
  return {};
}

function normalizeLocalizedEvents(events) {
  if (!events) return {};
  if (Array.isArray(events)) {
    const map = {};
    for (const item of events) {
      if (!item || typeof item !== "object" || !isNonEmptyString(item.name)) continue;
      map[item.name] = {
        label: isNonEmptyString(item.label) ? item.label : undefined,
        desc: isNonEmptyString(item.desc) ? item.desc : undefined,
        values: item.values && typeof item.values === "object" ? deepClone(item.values) : {}
      };
    }
    return map;
  }
  if (typeof events === "object") return deepClone(events);
  return {};
}

function normalizeLocales(manifest, rootAriaLabel) {
  const locales = {};
  const manifestLocales = manifest && manifest.locales && typeof manifest.locales === "object"
    ? manifest.locales
    : {};

  for (const [localeKey, rawLocale] of Object.entries(manifestLocales)) {
    const locale = normalizeLocale(localeKey);
    const source = rawLocale && typeof rawLocale === "object" ? rawLocale : {};
    locales[locale] = {
      name: isNonEmptyString(source.name) ? source.name.trim() : "",
      tags: Array.isArray(source.tags) ? source.tags.filter(isNonEmptyString).map((v) => v.trim()) : [],
      ariaLabel: isNonEmptyString(source.ariaLabel) ? source.ariaLabel.trim() : "",
      description: isNonEmptyString(source.description) ? source.description.trim() : undefined,
      props: normalizeLocalizedProps(source.props),
      events: normalizeLocalizedEvents(source.events)
    };
  }

  if (!locales["zh-CN"]) {
    locales["zh-CN"] = {
      name: isNonEmptyString(manifest.name) ? manifest.name.trim() : "",
      tags: Array.isArray(manifest.tags) ? manifest.tags.filter(isNonEmptyString).map((v) => v.trim()) : [],
      ariaLabel: isNonEmptyString(rootAriaLabel)
        ? rootAriaLabel.trim()
        : (isNonEmptyString(manifest.name) ? manifest.name.trim() : ""),
      description: undefined,
      props: Array.isArray(manifest.props)
        ? manifest.props.reduce((acc, prop) => {
            if (prop && isNonEmptyString(prop.key)) {
              acc[prop.key] = {
                label: isNonEmptyString(prop.label) ? prop.label.trim() : undefined,
                desc: isNonEmptyString(prop.desc) ? prop.desc.trim() : undefined,
                category: isNonEmptyString(prop.category) ? prop.category.trim() : undefined
              };
            }
            return acc;
          }, {})
        : {},
      events: Array.isArray(manifest.events)
        ? manifest.events.reduce((acc, evt) => {
            if (evt && isNonEmptyString(evt.name)) {
              acc[evt.name] = {
                label: undefined,
                desc: undefined,
                values: evt.values && typeof evt.values === "object" ? deepClone(evt.values) : {}
              };
            }
            return acc;
          }, {})
        : {}
    };
  }

  if (!locales.en && (isNonEmptyString(manifest.nameEn) || Array.isArray(manifest.tagsEn))) {
    locales.en = {
      name: isNonEmptyString(manifest.nameEn) ? manifest.nameEn.trim() : "",
      tags: Array.isArray(manifest.tagsEn) ? manifest.tagsEn.filter(isNonEmptyString).map((v) => v.trim()) : [],
      ariaLabel: isNonEmptyString(manifest.ariaLabelEn) ? manifest.ariaLabelEn.trim() : "",
      description: undefined,
      props: {},
      events: {}
    };
  }

  for (const localeKey of Object.keys(locales)) {
    if (!locales[localeKey].ariaLabel && locales[localeKey].name) {
      locales[localeKey].ariaLabel = locales[localeKey].name;
    }
  }

  return locales;
}

function resolveLocaleEntry(locales, locale) {
  const normalized = normalizeLocale(locale);
  const source = locales && typeof locales === "object" ? locales : {};
  return source[normalized] || source[DEFAULT_LOCALE] || source.en || {};
}

function localizeProps(props, localeEntry) {
  const localizedText = localeEntry && localeEntry.props && typeof localeEntry.props === "object"
    ? localeEntry.props
    : {};
  return (Array.isArray(props) ? props : []).map((prop) => {
    const localized = localizedText[prop.key] || {};
    const next = deepClone(prop);
    next.label = isNonEmptyString(localized.label) ? localized.label : (prop.label || prop.key);
    next.desc = isNonEmptyString(localized.desc) ? localized.desc : (prop.desc || "");
    if (isNonEmptyString(localized.category)) next.category = localized.category;
    return next;
  });
}

function localizeEvents(events, localeEntry) {
  const localizedText = localeEntry && localeEntry.events && typeof localeEntry.events === "object"
    ? localeEntry.events
    : {};
  return (Array.isArray(events) ? events : []).map((evt) => {
    const localized = localizedText[evt.name] || {};
    const next = deepClone(evt);
    if (isNonEmptyString(localized.label)) next.label = localized.label;
    if (isNonEmptyString(localized.desc)) next.desc = localized.desc;
    if (localized.values && typeof localized.values === "object") next.values = deepClone(localized.values);
    return next;
  });
}

function normalizeCategoryNames(rawData) {
  const categories = rawData && rawData.categories && typeof rawData.categories === "object"
    ? rawData.categories
    : {};
  const result = {};
  for (const [category, value] of Object.entries(categories)) {
    const entry = value && typeof value === "object" ? value : {};
    const locales = {};
    if (entry.locales && typeof entry.locales === "object") {
      for (const [localeKey, text] of Object.entries(entry.locales)) {
        if (isNonEmptyString(text)) locales[normalizeLocale(localeKey)] = text.trim();
      }
    }
    if (!locales["zh-CN"] && isNonEmptyString(entry.name)) locales["zh-CN"] = entry.name.trim();
    if (!locales.en && isNonEmptyString(entry.nameEn)) locales.en = entry.nameEn.trim();
    result[category] = {
      name: locales["zh-CN"] || category,
      nameEn: locales.en || locales["zh-CN"] || category,
      locales
    };
  }
  return result;
}

function localizeRegistryItem(item, locale) {
  const normalizedLocale = normalizeLocale(locale);
  const localeEntry = resolveLocaleEntry(item.locales, normalizedLocale);
  const categoryLocales = item.categoryLocales && typeof item.categoryLocales === "object"
    ? item.categoryLocales
    : {};
  const localizedCategory = categoryLocales[normalizedLocale] || categoryLocales[DEFAULT_LOCALE] || item.category;
  const next = deepClone(item);
  next.name = localeEntry.name || item.name || item.id;
  next.nameEn = resolveLocaleEntry(item.locales, "en").name || item.nameEn || next.name;
  next.tags = Array.isArray(localeEntry.tags) && localeEntry.tags.length ? localeEntry.tags.slice() : (Array.isArray(item.tags) ? item.tags.slice() : []);
  next.ariaLabel = localeEntry.ariaLabel || item.ariaLabel || next.name;
  next.description = localeEntry.description || item.description || null;
  next.categoryName = localizedCategory;
  next.categoryNameEn = categoryLocales.en || item.categoryNameEn || localizedCategory;
  next.propTexts = localizeProps(item.props, localeEntry).reduce((acc, prop) => {
    acc[prop.key] = {
      label: prop.label || prop.key,
      desc: prop.desc || ""
    };
    if (prop.category) acc[prop.key].category = prop.category;
    return acc;
  }, {});
  next.eventTexts = localizeEvents(item.events, localeEntry).reduce((acc, evt) => {
    acc[evt.name] = {
      label: evt.label || evt.name,
      desc: evt.desc || "",
      values: evt.values && typeof evt.values === "object" ? deepClone(evt.values) : {}
    };
    return acc;
  }, {});
  next.props = localizeProps(item.props, localeEntry);
  next.events = localizeEvents(item.events, localeEntry);
  return next;
}

module.exports = {
  BILINGUAL_SAMPLE_IDS,
  DEFAULT_LOCALE,
  LEGACY_SCHEMA,
  LOCALIZED_SCHEMA,
  SUPPORTED_LOCALES,
  deepClone,
  isNonEmptyString,
  localizeEvents,
  localizeProps,
  localizeRegistryItem,
  normalizeCategoryNames,
  normalizeLocale,
  normalizeLocales,
  resolveLocaleEntry
};
