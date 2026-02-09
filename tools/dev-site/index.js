#!/usr/bin/env node
/**
 * 开发服务器：启动本地预览（无热重载）
 *
 * 功能：
 * 1. 提供 site/ 与项目根目录的静态文件服务
 * 2. 监听 components/** 变更，自动重建 registry
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../../');
const SITE_DIR = path.join(ROOT, 'site');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const indexFile = path.join(filePath, 'index.html');
    if (fs.existsSync(indexFile)) {
      serveFile(indexFile, res);
    } else {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
    }
    return;
  }

  const content = fs.readFileSync(filePath);
  const mime = getMimeType(filePath);

  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache',
  });
  res.end(content);
}

let building = false;
let pending = false;

function runBuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;

  // 这里只在开发时重建 registry：
  // - registry 变化后，前端页面直接从 /registry/*.json 读取即可
  // - 避免每次都完整执行 build-site，提升响应速度
  const steps = [
    ['node', ['tools/build-registry/index.js']],
  ];

  function runStep(index) {
    if (index >= steps.length) {
      building = false;
      if (pending) {
        pending = false;
        runBuild();
      }
      return;
    }

    const [cmd, args] = steps[index];
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        building = false;
        pending = false;
        return;
      }
      runStep(index + 1);
    });
  }

  runStep(0);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const start = Date.now();

  let filePath = url.pathname;

  // 默认 index.html
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // 移除开头的 /
  filePath = filePath.slice(1);

  // 安全：不允许 .. 路径
  if (filePath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // 优先从 site/ 查找，然后回退到根目录（用于 components/ registry/）
  let fullPath = path.join(SITE_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(ROOT, filePath);
  }

  serveFile(fullPath, res);
});

server.listen(PORT, () => {
});

// 监听 components/ 变更，触发自动构建 + 刷新
// 注意：不要监听 registry/，否则 build-registry 自己写入 registry.json 会导致无限循环重建
const watchTargets = [
  path.join(ROOT, 'components'),
];

for (const dir of watchTargets) {
  if (!fs.existsSync(dir)) continue;
  try {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      runBuild();
    });
  } catch (e) {
    // ignore watch errors
  }
}
