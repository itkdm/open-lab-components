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
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org"
  }
};

const MCP_PACKAGE_METADATA = {};

module.exports = {
  MCP_PACKAGE_METADATA,
  ROOT_PACKAGE_METADATA,
  SHARED_PACKAGE_METADATA
};
