# 测试与检查

关于这些检查背后的仓库边界，请先参考 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 根库检查

先跑文本文件边界检查：

```bash
npm run check:text
```

它会验证受版本控制的文本文件是否符合仓库规定的 UTF-8 无 BOM 与 LF 换行。

再跑脚本清单边界检查：

```bash
npm run check:scripts
```

它会验证根 `package.json` 中的 scripts 是否仍与共享脚本清单一致，同时检查根包的 `files`、共享 package metadata、`dependencies` / `devDependencies` 契约以及共享版本号。

再跑根文档边界检查：

```bash
npm run check:docs
```

它会验证根 README、快速开始、贡献指南、架构/测试文档是否仍保留共享命令入口、生成产物引用和 root API 示例，同时确认版本化 release 文档与当前包版本、tag 和发布流程顺序保持一致。

再跑生成产物边界检查：

```bash
npm run check:generated
```

它会验证 `registry/` 输出和 `site/dist/` 构建条目是否存在，并符合共享生成边界约定。

用一条命令跑完整根仓库质量路径：

```bash
npm run check:root
```

它会执行：

1. `tools/check-text/index.js`
2. `tools/check-scripts/index.js`
3. `tools/check-docs/index.js`
4. `tests/root-api.test.js`
5. `tools/runtime-harness/runtime-lifecycle.test.js`
6. `tools/validate/index.js`

其中 `tests/root-api.test.js` 还会验证根 JS 导出面、共享查询 API 契约和 `index.d.ts` 类型声明。

MCP catalog 测试也会间接覆盖 `lib/catalog.js` 这一层，因为它同时服务于根包 API 和 MCP 检索面。

## 面向发布的检查

发布前运行：

```bash
npm run check:release
```

这一步用来确认两个 npm 包在当前状态下仍能打包出预期关键文件。

较窄的 npm 发布钩子仍然是：

```bash
npm run prepublishOnly
```

它只覆盖 `build:registry` 和 `check:registry`，而更完整的发布前检查仍由 `release:check` 负责。

## MCP 包检查

运行 MCP 脚本清单边界检查：

```bash
npm run mcp:check:scripts
```

它会验证 `mcp-server/package.json` 中的 scripts 是否仍与共享 MCP 脚本清单一致，并检查 MCP 包的 `files`、共享 package metadata、`bin` 边界、依赖契约与共享版本号。

运行 MCP 文档边界检查：

```bash
npm run mcp:check:docs
```

它会验证 MCP README 与部署文档中仍然包含共享运行时环境变量、运维路由、验证命令与启动入口说明。

## 单项检查

运行根 API 冒烟测试：

```bash
npm run test:root
```

运行 runtime 生命周期 harness：

```bash
npm run test:runtime
```

运行组件校验：

```bash
npm run validate
```
