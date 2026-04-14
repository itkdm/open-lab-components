"use strict";

function createReleaseWorkflow(version) {
  const tag = `v${version}`;
  return [
    { title: "Root quality", command: "npm run check:root" },
    { title: "Release smoke", command: "npm run check:release" },
    { title: "Full release checks", command: "npm run release:ready" },
    { title: "Review diff", command: "git diff -- package.json mcp-server/package.json README.en.md README.md docs site/index.html" },
    {
      title: "Commit release changes",
      command: `git commit -m "release: prepare ${tag} locale-aware metadata rollout"`
    },
    { title: "Create tag", command: `git tag ${tag}` },
    { title: "Publish root package", command: "npm publish" },
    { title: "Publish MCP package", command: "npm --prefix mcp-server publish" },
    { title: "Push branch", command: "git push origin <branch>" },
    { title: "Push tag", command: `git push origin ${tag}` },
    { title: "Create GitHub release", command: `docs/GITHUB-RELEASE-${version}.md` },
    { title: "Post announcement", command: `docs/ANNOUNCEMENT-${version}.zh-CN.md` }
  ];
}

module.exports = {
  createReleaseWorkflow
};
