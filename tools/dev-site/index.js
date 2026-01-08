#!/usr/bin/env node
/**
 * 开发服务器：启动本地预览（简单 HTTP 服务器）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

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
  res.writeHead(200, {
    'Content-Type': getMimeType(filePath),
    'Cache-Control': 'no-cache',
  });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
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
  console.log(`\n🚀 Dev server running at http://localhost:${PORT}`);
  console.log(`   Site directory: ${SITE_DIR}`);
  console.log(`   Press Ctrl+C to stop\n`);
});

