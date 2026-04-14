const fs = require("fs");
const path = require("path");

const SITE_STATIC_DIRS = ["assets", "pages"];
const SITE_ROOT_ASSET_PREFIXES = ["components/", "registry/", "docs/"];
const SITE_STATIC_FILE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp"
]);

function listSiteHtmlFiles(siteDir) {
  return fs.readdirSync(siteDir).filter((fileName) => fileName.endsWith(".html"));
}

function listSiteStaticFiles(siteDir) {
  return fs.readdirSync(siteDir).filter((fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    return SITE_STATIC_FILE_EXTENSIONS.has(ext);
  });
}

function isAllowedSiteRootAssetPath(relPath) {
  return SITE_ROOT_ASSET_PREFIXES.some(
    (prefix) => relPath === prefix.slice(0, -1) || relPath.startsWith(prefix)
  );
}

module.exports = {
  SITE_ROOT_ASSET_PREFIXES,
  SITE_STATIC_DIRS,
  SITE_STATIC_FILE_EXTENSIONS,
  isAllowedSiteRootAssetPath,
  listSiteHtmlFiles,
  listSiteStaticFiles
};
