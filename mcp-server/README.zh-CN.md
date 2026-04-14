# Open Lab Components MCP Server

[English](./README.md) | 中文

这是 Open Lab Components 的 locale-aware MCP server，用于检索、推荐和读取组件目录。

## 这个包提供什么

### 传输模式

- 本地 `stdio`
- 远程 `Streamable HTTP`

### Tools

- `get_categories`
- `list_components`
- `search_components`
- `recommend_components`
- `submit_recommendation_feedback`
- `get_recommendation_feedback_stats`
- `build_experiment_page`
- `compose_experiment_bundle`
- `get_component`

### Prompts

- `component-recommendation-brief`
- `component-page-builder`
- `experiment-page-executor`
- `experiment-bundle-integrator`

### Resources

- `openlab://catalog/overview`
- `openlab://catalog/categories`
- `openlab://catalog/featured`
- `openlab://component/phy.resistor.axial.basic`

这个包仍然保持“只读组件源码”的边界，不会通过 MCP 创建、编辑或校验组件 HTML。

## 本地使用

```bash
cd mcp-server
npm install
npm start
```

从仓库根目录启动：

```bash
npm run mcp:start
npm run mcp:start:http
```

运行测试：

```bash
npm run mcp:test
```

可选后端集成测试：

- 设置 `REDIS_URL` 可启用 Redis 反馈后端测试
- 设置 `POSTGRES_URL` 可启用 PostgreSQL 反馈后端测试

## 远程 HTTP 使用

先从示例生成客户配置：

```bash
cp ./config/customers.example.json ./config/customers.json
```

生成 Bearer token 和配置片段：

```bash
npm run token:generate
```

启动远程服务：

```bash
npm run start:http
```

常用校验命令：

```bash
npm run check:scripts
npm run smoke:remote
npm run pack:check
```

## 运行时特性

- Bearer token 鉴权
- 按客户配置 tool allowlist
- session TTL 与并发 session 上限
- 带响应头的内存限流
- 结构化日志与 request id
- `/healthz`、`/readyz`、`/metrics`
- 推荐反馈持久化恢复
- file、Redis、PostgreSQL 反馈后端
- 时间衰减的 reranking 信号

## locale 行为

- 默认 locale：`zh-CN`
- 支持语言：`zh-CN`、`en`
- 所有公开 tool 都接受可选 `locale`
- 返回结果保留完整 `locales`
- 展示字段缺失时回退到 `zh-CN`

## 入口

发布后的命令行入口：

- `open-lab-components-mcp`
- `open-lab-components-mcp-http`

本地源码入口：

- `src/core/cli.js`
- `src/core/http-cli.js`

## 文档

- [English README](./README.md)
- [仓库级 MCP English Docs](../docs/MCP.en.md)
- [仓库级 MCP 中文文档](../docs/MCP.zh-CN.md)
- [远程部署英文说明](../docs/MCP_REMOTE.en.md)
- [远程部署中文说明](../docs/MCP_REMOTE.zh-CN.md)
- [部署指南](./DEPLOYMENT.zh-CN.md)
- [English Deployment Guide](./DEPLOYMENT.en.md)
- [部署检查清单](./DEPLOYMENT-CHECKLIST.zh-CN.md)
- [English Deployment Checklist](./DEPLOYMENT-CHECKLIST.en.md)
- [运维说明](./OPERATIONS.zh-CN.md)
- [English Operations Guide](./OPERATIONS.en.md)
