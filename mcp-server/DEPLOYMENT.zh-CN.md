# MCP Server 部署说明

这份文档给出 Open Lab Components MCP server 的最短可运行托管部署路径。

## 前置条件

- Node.js 18+
- 可写的 `config/` 目录，用于客户配置
- 可写的 `data/` 目录，用于文件型反馈后端
- 如果需要 HTTPS 与来源控制，需要配反向代理或 ingress

## 1. 安装依赖

```bash
cd mcp-server
npm install
```

## 2. 准备环境变量

从 `.env.example` 开始，至少设置：

```bash
MCP_RUNTIME_HOME=/srv/open-lab-components-mcp
HOST=127.0.0.1
PORT=3000
CUSTOMERS_CONFIG_PATH=./config/customers.json
LOG_LEVEL=info
ALLOWED_HOSTS=
ALLOWED_ORIGINS=
TRUST_PROXY=false
ADMIN_BEARER_TOKEN=replace-with-admin-token
METRICS_BEARER_TOKEN=replace-with-metrics-token
FEEDBACK_STORE_PATH=./data/feedback-store.json
```

## 3. 创建客户配置

```bash
cp ./config/customers.example.json ./config/customers.json
npm run token:generate
```

## 4. 启动 HTTP 服务

```bash
npm run start:http
```

## 5. 验证部署

```bash
curl http://127.0.0.1:3000/healthz
npm run smoke:remote
```

## 相关文档

- [English Deployment Guide](./DEPLOYMENT.en.md)
- [部署检查清单](./DEPLOYMENT-CHECKLIST.zh-CN.md)
- [运维说明](./OPERATIONS.zh-CN.md)
