"use strict";

var i18n = require("./i18n.js");

var VISUAL_TAXONOMY = Object.freeze({
  subjects: {
    biology: { "zh-CN": "生物", en: "Biology" },
    chemistry: { "zh-CN": "化学", en: "Chemistry" },
    cs: { "zh-CN": "计算机", en: "Computer Science" },
    math: { "zh-CN": "数学", en: "Math" },
    physics: { "zh-CN": "物理", en: "Physics" },
    science: { "zh-CN": "科学", en: "Science" }
  },
  types: {
    diagram: { "zh-CN": "示意图", en: "Diagram" },
    flowchart: { "zh-CN": "流程图", en: "Flowchart" },
    "knowledge-map": { "zh-CN": "知识图", en: "Knowledge Map" },
    procedure: { "zh-CN": "实验流程", en: "Procedure" }
  },
  grades: {
    "primary-school": { "zh-CN": "小学", en: "Primary School" },
    "middle-school": { "zh-CN": "初中", en: "Middle School" },
    "high-school": { "zh-CN": "高中", en: "High School" }
  },
  originTypes: {
    "ai-generated": { "zh-CN": "AI 生成", en: "AI Generated" },
    "teacher-made": { "zh-CN": "教师整理", en: "Teacher Made" },
    licensed: { "zh-CN": "授权素材", en: "Licensed" },
    curated: { "zh-CN": "整理收录", en: "Curated" }
  },
  thumbnailModes: {
    cover: { "zh-CN": "裁切封面", en: "Cover Crop" },
    contain: { "zh-CN": "完整展示", en: "Contain" },
    focus: { "zh-CN": "焦点裁切", en: "Focal Crop" }
  }
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function localizeMap(map, locale) {
  var normalized = i18n.normalizeLocale(locale);
  var result = {};
  for (var key in map) {
    if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
    var labels = map[key] || {};
    result[key] = labels[normalized] || labels[i18n.DEFAULT_LOCALE] || labels.en || key;
  }
  return result;
}

function localizeValue(group, key, locale) {
  var source = VISUAL_TAXONOMY[group] || {};
  var labels = source[key] || {};
  var normalized = i18n.normalizeLocale(locale);
  return labels[normalized] || labels[i18n.DEFAULT_LOCALE] || labels.en || key;
}

function createTaxonomyPayload(locale) {
  var normalized = i18n.normalizeLocale(locale);
  return {
    schema: "olc-visual-taxonomy/v1",
    generatedAt: new Date().toISOString(),
    defaultLocale: i18n.DEFAULT_LOCALE,
    locale: normalized,
    locales: i18n.SUPPORTED_LOCALES.slice(),
    subjects: localizeMap(VISUAL_TAXONOMY.subjects, normalized),
    types: localizeMap(VISUAL_TAXONOMY.types, normalized),
    grades: localizeMap(VISUAL_TAXONOMY.grades, normalized),
    originTypes: localizeMap(VISUAL_TAXONOMY.originTypes, normalized),
    thumbnailModes: localizeMap(VISUAL_TAXONOMY.thumbnailModes, normalized)
  };
}

module.exports = {
  VISUAL_TAXONOMY: VISUAL_TAXONOMY,
  createTaxonomyPayload: createTaxonomyPayload,
  localizeValue: localizeValue
};
