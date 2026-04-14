"use strict";

const {
  ROOT_API_README_SNIPPETS,
  ROOT_QUERY_API_README_SNIPPETS
} = require("../../lib/root-api-metadata");

const ROOT_DOC_CHECK_COMMANDS = [
  "npm run check:text",
  "npm run check:scripts",
  "npm run check:docs",
  "npm run check:generated",
  "npm run check:root",
  "npm run check:release"
];

const ROOT_RELEASE_DOC_COMMANDS = [
  "npm run check:root",
  "npm run check:release",
  "npm run release:ready",
  "npm run release:check",
  "npm run release:pack",
  "git tag v0.2.0",
  "npm publish",
  "npm --prefix mcp-server publish"
];

const ROOT_RELEASE_DOC_REFERENCES = [
  "docs/GITHUB-RELEASE-0.2.0.md",
  "docs/ANNOUNCEMENT-0.2.0.zh-CN.md",
  "registry/registry.json"
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
      "site/dist/",
      ...ROOT_API_README_SNIPPETS,
      ...ROOT_QUERY_API_README_SNIPPETS
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
  },
  {
    relativePath: "docs/PUBLISHING.md",
    requiredSnippets: [
      "npm run check:root",
      "npm run check:release",
      "npm run release:ready",
      "npm --prefix mcp-server publish",
      "git tag v0.2.0"
    ]
  },
  {
    relativePath: "docs/RELEASE-CHECKLIST-0.2.0.md",
    requiredSnippets: [
      "npm run release:ready",
      "npm run release:check",
      "npm run release:pack",
      "registry/registry.json",
      "docs/GITHUB-RELEASE-0.2.0.md"
    ]
  },
  {
    relativePath: "docs/RELEASE-COMMANDS-0.2.0.md",
    requiredSnippets: [
      "npm run release:ready",
      "git tag v0.2.0",
      "npm publish",
      "npm --prefix mcp-server publish",
      "docs/GITHUB-RELEASE-0.2.0.md"
    ]
  },
  {
    relativePath: "docs/RELEASE-SMOKE.md",
    requiredSnippets: [
      "npm run check:release",
      "registry/registry.json",
      "@itkdm/open-lab-components",
      "@itkdm/open-lab-components-mcp"
    ]
  }
];

module.exports = {
  ROOT_DOC_CHECK_COMMANDS,
  ROOT_DOC_SURFACES,
  ROOT_GENERATED_ARTIFACT_REFERENCES,
  ROOT_RELEASE_DOC_COMMANDS,
  ROOT_RELEASE_DOC_REFERENCES
};
