# MCP Server（中文）

[English](./MCP.en.md)

Open Lab Components 在 [mcp-server/](../mcp-server/) 中提供独立的 MCP server 包，用于让本地客户端、远程服务和 AI Agent 统一检索、推荐和读取组件目录。

## 当前范围

当前实现已经不再局限于最早的“只读 stdio 目录服务”。仓库中的 MCP 子系统当前支持：

- 本地 `stdio` 模式
- 远程 `Streamable HTTP` 模式
- tools、prompts、resources
- locale-aware 组件检索与读取
- 推荐反馈与页面组装能力

它仍然保持一个重要边界：

- 不通过 MCP 创建、编辑或验证组件源码

## 当前公开 tools

- `get_categories({ locale? })`
- `list_components({ category?, tag?, hasEvents?, limit?, locale? })`
- `search_components({ query, category?, limit?, locale? })`
- `recommend_components({ subject, lessonGoal, audience?, interactionMode?, preferredCategories?, excludeCategories?, mustIncludeTags?, limit?, locale? })`
- `submit_recommendation_feedback({ componentId, feedbackType, subject?, lessonGoal?, audience?, interactionMode?, preferredCategories?, mustIncludeTags?, signalWeight? })`
- `get_recommendation_feedback_stats({ customerId? })`
- `build_experiment_page({ subject, lessonGoal, audience?, interactionMode?, pageType?, preferredCategories?, mustIncludeTags?, maxComponents?, locale? })`
- `compose_experiment_bundle({ subject?, lessonGoal?, audience?, interactionMode?, pageType?, componentIds?, preferredCategories?, mustIncludeTags?, maxComponents?, locale? })`
- `get_component({ id, locale? })`

说明：

- `list_components` 与 `search_components` 返回摘要，不返回 HTML
- `get_component` 返回完整组件记录和 HTML
- 其余能力用于推荐、反馈、实验页规划与最终 bundle 组装

## 当前公开 prompts

- `component-recommendation-brief`
- `component-page-builder`
- `experiment-page-executor`
- `experiment-bundle-integrator`

这些 prompt 用于引导 Agent 围绕选型、页面规划与 bundle 集成调用 MCP tools。

## 当前公开 resources

- `openlab://catalog/overview`
- `openlab://catalog/categories`
- `openlab://catalog/featured`
- `openlab://component/phy.resistor.axial.basic`

这些资源适合给宿主或 Agent 提供快速目录上下文。

## 本地开发

安装 MCP 子包依赖：

```bash
cd mcp-server
npm install
```

启动本地 `stdio` server：

```bash
npm start
```

从仓库根目录启动：

```bash
npm run mcp:start
```

启动远程 HTTP 入口：

```bash
npm run mcp:start:http
```

运行测试：

```bash
npm run mcp:test
```

## 本地客户端配置

如果是 Claude Desktop 等本地 `stdio` 客户端，可配置：

- command: `node`
- args: `mcp-server/src/core/cli.js` 的绝对路径

示例：

```json
{
  "mcpServers": {
    "open-lab-components": {
      "command": "node",
      "args": [
        "/absolute/path/to/open-lab-components/mcp-server/src/core/cli.js"
      ]
    }
  }
}
```

## 远程 HTTP 运行

远程模式入口位于：

- `mcp-server/src/core/http-cli.js`
- `mcp-server/src/core/remote-server.js`

远程模式支持：

- Bearer token 鉴权
- 按客户配置 tool allowlist
- session TTL 与并发 session 控制
- rate limiting
- `/healthz`、`/readyz`、`/metrics`
- 反馈持久化与重排序恢复
- file / Redis / PostgreSQL 后端

详细部署说明见：

- [MCP_REMOTE.md](./MCP_REMOTE.md)
- [mcp-server/DEPLOYMENT.md](../mcp-server/DEPLOYMENT.md)
- [mcp-server/OPERATIONS.md](../mcp-server/OPERATIONS.md)

## locale 行为

- 默认 locale：`zh-CN`
- 当前 locale：`zh-CN`、`en`
- 所有公开 tools 都接受可选 `locale`
- 返回结果会保留完整 `locales` 载荷
- 当目标语言缺失时，展示字段按字段回退到 `zh-CN`

## 发布边界

MCP server 会作为独立 npm 包发布：

- package: `@itkdm/open-lab-components-mcp`
- binaries:
  - `open-lab-components-mcp`
  - `open-lab-components-mcp-http`

## 相关文档

- [MCP English Docs](./MCP.en.md)
- [mcp-server README](../mcp-server/README.md)
- [mcp-server 中文说明](../mcp-server/README.zh-CN.md)
- [I18N 发布说明](./RELEASE-2026-03-I18N.md)
