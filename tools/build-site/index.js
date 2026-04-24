#!/usr/bin/env node
/**
 * 构建展示站：将 components/ 和 registry/ 复制到 site/dist/，并生成静态页面
 */

const fs = require('fs');
const path = require('path');
const { projectPathsFrom } = require('../_lib/paths');
const {
  SITE_REPUBLISHED_ROOT_DIRS,
  SITE_STATIC_DIRS,
  listSiteHtmlFiles,
  listSiteStaticFiles
} = require('../_lib/site');

const PATHS = projectPathsFrom(__dirname);
const SITE_SRC = PATHS.siteDir;
const SITE_DIST = PATHS.siteDistDir;
const REPUBLISHED_DIR_SOURCES = {
  components: PATHS.componentsDir,
  registry: PATHS.registryDir,
  docs: PATHS.docsDir,
  visuals: PATHS.visualsDir,
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resetDir(dir) {
  if (!fs.existsSync(dir)) {
    ensureDir(dir);
    return;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  ensureDir(dir);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  // 清理并创建 dist
  resetDir(SITE_DIST);

  for (const dir of SITE_REPUBLISHED_ROOT_DIRS) {
    const srcDir = REPUBLISHED_DIR_SOURCES[dir];
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, path.join(SITE_DIST, dir));
    }
  }

  // 复制 site 静态资源（如果有）
  for (const dir of SITE_STATIC_DIRS) {
    const srcDir = path.join(SITE_SRC, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, path.join(SITE_DIST, dir));
    }
  }

  // 复制 site/*.html 到 dist
  const htmlFiles = listSiteHtmlFiles(SITE_SRC);
  for (const file of htmlFiles) {
    fs.copyFileSync(path.join(SITE_SRC, file), path.join(SITE_DIST, file));
  }

  // 复制 site 中的图片等静态资源
  const staticFiles = listSiteStaticFiles(SITE_SRC);
  for (const file of staticFiles) {
    fs.copyFileSync(path.join(SITE_SRC, file), path.join(SITE_DIST, file));
  }

  // 创建 .nojekyll 文件（禁用 GitHub Pages 的 Jekyll 处理）
  fs.writeFileSync(path.join(SITE_DIST, '.nojekyll'), '', 'utf8');

}

if (require.main === module) {
  main();
}

module.exports = { main };
