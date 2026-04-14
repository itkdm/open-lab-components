"use strict";

const SHARED_PACKAGE_METADATA = {
  author: "itkdm (https://github.com/itkdm)",
  bugs: {
    url: "https://github.com/itkdm/open-lab-components/issues"
  },
  engines: {
    node: ">=18.0.0"
  },
  homepage: "https://github.com/itkdm/open-lab-components#readme",
  license: "MIT",
  repository: {
    type: "git",
    url: "git+https://github.com/itkdm/open-lab-components.git"
  }
};

const ROOT_PACKAGE_METADATA = {
  description:
    "Open protocol and runtime-ready component library for composable STEM interactive objects with locale-aware metadata and MCP support.",
  main: "index.js",
  name: "@itkdm/open-lab-components",
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org"
  },
  types: "index.d.ts",
  keywords: [
    "components",
    "html",
    "fragment",
    "protocol",
    "manifest",
    "registry",
    "mcp",
    "i18n",
    "localization",
    "physics",
    "chemistry",
    "biology",
    "math",
    "education",
    "stem",
    "lab",
    "apparatus",
    "interactive",
    "svg",
    "science",
    "simulation"
  ]
};

const MCP_PACKAGE_METADATA = {
  description: "Locale-aware MCP server for discovering and retrieving Open Lab Components.",
  name: "@itkdm/open-lab-components-mcp",
  type: "module",
  bin: {
    "open-lab-components-mcp": "./src/core/cli.js",
    "open-lab-components-mcp-http": "./src/core/http-cli.js"
  },
  keywords: [
    "mcp",
    "model-context-protocol",
    "components",
    "registry",
    "education",
    "stem",
    "localization"
  ]
};

module.exports = {
  MCP_PACKAGE_METADATA,
  ROOT_PACKAGE_METADATA,
  SHARED_PACKAGE_METADATA
};
