const fs = require("fs");
const path = require("path");

const SITE_DEFAULT_DOCUMENT = "index.html";
const SITE_REPUBLISHED_ROOT_DIRS = ["components", "registry", "docs"];
const SITE_STATIC_DIRS = ["assets", "pages"];
const SITE_ROOT_ASSET_PREFIXES = SITE_REPUBLISHED_ROOT_DIRS.map((dir) => `${dir}/`);
const SITE_STATIC_FILE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp"
]);
const SITE_MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

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

function listExpectedSiteDistEntries(siteDir) {
  const expected = new Set([".nojekyll", ...SITE_REPUBLISHED_ROOT_DIRS]);

  for (const fileName of listSiteHtmlFiles(siteDir)) {
    expected.add(fileName);
  }

  for (const fileName of listSiteStaticFiles(siteDir)) {
    expected.add(fileName);
  }

  for (const dir of SITE_STATIC_DIRS) {
    if (fs.existsSync(path.join(siteDir, dir))) {
      expected.add(dir);
    }
  }

  return Array.from(expected).sort();
}

function getSiteMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SITE_MIME_TYPES[ext] || "application/octet-stream";
}

module.exports = {
  SITE_DEFAULT_DOCUMENT,
  SITE_MIME_TYPES,
  SITE_REPUBLISHED_ROOT_DIRS,
  SITE_ROOT_ASSET_PREFIXES,
  SITE_STATIC_DIRS,
  SITE_STATIC_FILE_EXTENSIONS,
  getSiteMimeType,
  isAllowedSiteRootAssetPath,
  listExpectedSiteDistEntries,
  listSiteHtmlFiles,
  listSiteStaticFiles
};
