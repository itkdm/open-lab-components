"use strict";

const ROOT_DOC_CHECK_COMMANDS = [
  "npm run check:text",
  "npm run check:scripts",
  "npm run check:docs",
  "npm run check:generated",
  "npm run check:root",
  "npm run check:release"
];

const ROOT_GENERATED_ARTIFACT_REFERENCES = [
  "registry/registry.json",
  "registry/*.json",
  "site/dist/"
];

const ROOT_DOC_SURFACES = [
  {
    relativePath: "README.md",
    requiredSnippets: [
      "npm run check:root",
      "npm run build:registry",
      "registry/registry.json",
      "site/dist/"
    ]
  },
  {
    relativePath: "QUICK_START.md",
    requiredSnippets: [
      "npm run validate",
      "npm run build:registry",
      "npm run build:site",
      "npm run check:root",
      "registry/registry.json"
    ]
  },
  {
    relativePath: "docs/CONTRIBUTING.md",
    requiredSnippets: [
      "npm run validate",
      "npm run build:registry",
      "npm run check:root",
      "registry/*.json"
    ]
  },
  {
    relativePath: "docs/ARCHITECTURE.md",
    requiredSnippets: [
      "npm run check:docs",
      "site/dist/"
    ]
  },
  {
    relativePath: "docs/TESTING.md",
    requiredSnippets: [
      "npm run check:docs",
      "npm run check:root",
      "npm run check:generated"
    ]
  }
];

module.exports = {
  ROOT_DOC_CHECK_COMMANDS,
  ROOT_DOC_SURFACES,
  ROOT_GENERATED_ARTIFACT_REFERENCES
};
