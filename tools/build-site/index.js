#!/usr/bin/env node
/**
 * 构建展示站：将 components/ 和 registry/ 复制到 site/dist/，并生成静态页面
 */

const fs = require('fs');
const path = require('path');
const { walkHtmlFiles } = require('../_lib/walk');

const ROOT = path.resolve(__dirname, '../../');
const SITE_SRC = path.join(ROOT, 'site');
const SITE_DIST = path.join(ROOT, 'site/dist');
const COMPONENTS_DIR = path.join(ROOT, 'components');
const REGISTRY_DIR = path.join(ROOT, 'registry');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
  console.log('Building site...');

  // 清理并创建 dist
  if (fs.existsSync(SITE_DIST)) {
    fs.rmSync(SITE_DIST, { recursive: true, force: true });
  }
  ensureDir(SITE_DIST);

  // 复制 components/ 到 site/dist/components/
  if (fs.existsSync(COMPONENTS_DIR)) {
    console.log('  Copying components/...');
    copyDir(COMPONENTS_DIR, path.join(SITE_DIST, 'components'));
  }

  // 复制 registry/ 到 site/dist/registry/
  if (fs.existsSync(REGISTRY_DIR)) {
    console.log('  Copying registry/...');
    copyDir(REGISTRY_DIR, path.join(SITE_DIST, 'registry'));
  }

  // 复制 site 静态资源（如果有）
  const staticDirs = ['assets', 'pages'];
  for (const dir of staticDirs) {
    const srcDir = path.join(SITE_SRC, dir);
    if (fs.existsSync(srcDir)) {
      console.log(`  Copying site/${dir}/...`);
      copyDir(srcDir, path.join(SITE_DIST, dir));
    }
  }

  // 复制 site/*.html 到 dist
  const htmlFiles = fs.readdirSync(SITE_SRC).filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    console.log(`  Copying site/${file}...`);
    fs.copyFileSync(path.join(SITE_SRC, file), path.join(SITE_DIST, file));
  }

  // 复制 site 中的图片等静态资源
  const staticFiles = fs.readdirSync(SITE_SRC).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'].includes(ext);
  });
  for (const file of staticFiles) {
    console.log(`  Copying site/${file}...`);
    fs.copyFileSync(path.join(SITE_SRC, file), path.join(SITE_DIST, file));
  }

  // 创建 .nojekyll 文件（禁用 GitHub Pages 的 Jekyll 处理）
  fs.writeFileSync(path.join(SITE_DIST, '.nojekyll'), '', 'utf8');

  console.log('✓ Site built to site/dist/');
}

if (require.main === module) {
  main();
}

module.exports = { main };

