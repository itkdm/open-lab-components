"use strict";

var fs = require("fs");
var path = require("path");

var registryPath = path.join(__dirname, "..", "..", "registry", "registry.json");
var outputPath = path.join(__dirname, "..", "..", "registry", "quality-report.json");

function hasDescription(item) {
  return !!(item && typeof item.description === "string" && item.description.trim());
}

function countDocumentedProps(item) {
  return (Array.isArray(item.props) ? item.props : []).filter(function (prop) {
    return !!(prop && typeof prop.desc === "string" && prop.desc.trim());
  }).length;
}

function countDocumentedEvents(item) {
  return (Array.isArray(item.events) ? item.events : []).filter(function (event) {
    return !!(
      event &&
      ((typeof event.desc === "string" && event.desc.trim()) ||
        (typeof event.label === "string" && event.label.trim()))
    );
  }).length;
}

function buildSignals(item) {
  var props = Array.isArray(item.props) ? item.props : [];
  var events = Array.isArray(item.events) ? item.events : [];
  var locales = item && item.locales && typeof item.locales === "object" ? item.locales : {};
  return {
    hasDescription: hasDescription(item),
    localeCount: Object.keys(locales).filter(function (locale) {
      var entry = locales[locale];
      return entry && entry.name && entry.ariaLabel;
    }).length,
    propCount: props.length,
    documentedPropCount: countDocumentedProps(item),
    eventCount: events.length,
    documentedEventCount: countDocumentedEvents(item),
    interactive: events.length > 0
  };
}

function scoreSignals(signals) {
  var score = 0;
  if (signals.hasDescription) score += 12;
  score += Math.min(8, signals.localeCount * 4);
  score += Math.min(12, signals.documentedPropCount * 3);
  score += Math.min(8, signals.documentedEventCount * 4);
  if (signals.interactive) score += 6;
  return score;
}

var registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
var items = Array.isArray(registry.items) ? registry.items : [];
var reportItems = {};

for (var i = 0; i < items.length; i += 1) {
  var item = items[i];
  var signals = buildSignals(item);
  reportItems[item.id] = {
    score: scoreSignals(signals),
    signals: signals
  };
}

var output = {
  schemaVersion: "openlab-quality-report/v1",
  generatedAt: new Date().toISOString(),
  componentCount: items.length,
  items: reportItems
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");
