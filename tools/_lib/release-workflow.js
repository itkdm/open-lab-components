"use strict";

const { RELEASE_SCRIPT_COMMANDS } = require("./release-manifest");

function createReleaseWorkflow(version) {
  const tag = `v${version}`;
  return [
    { title: "Root quality", command: RELEASE_SCRIPT_COMMANDS.rootQuality },
    { title: "Release smoke", command: RELEASE_SCRIPT_COMMANDS.releaseSmoke },
    { title: "Full release checks", command: RELEASE_SCRIPT_COMMANDS.releaseReady },
    { title: "Review diff", command: "git diff -- package.json mcp-server/package.json README.en.md README.md docs site/index.html" },
    {
      title: "Commit release changes",
      command: `git commit -m "release: prepare ${tag} locale-aware metadata rollout"`
    },
    { title: "Create tag", command: `git tag ${tag}` },
    { title: "Publish root package", command: RELEASE_SCRIPT_COMMANDS.rootPublish },
    { title: "Publish MCP package", command: RELEASE_SCRIPT_COMMANDS.mcpPublish },
    { title: "Push branch", command: "git push origin <branch>" },
    { title: "Push tag", command: `git push origin ${tag}` },
    { title: "Create GitHub release", command: `docs/GITHUB-RELEASE-${version}.md` },
    { title: "Post announcement", command: `docs/ANNOUNCEMENT-${version}.zh-CN.md` }
  ];
}

module.exports = {
  createReleaseWorkflow
};
