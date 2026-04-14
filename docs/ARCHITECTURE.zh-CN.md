# 架构说明

## 目的

这个仓库不是单一 npm 包，而是一个面向 STEM 教学组件的多出口产品仓库。它把同一套组件资产通过三个交付面提供出去：

- 根 npm 组件库
- 静态文档与展示站点
- MCP server 包

当前仓库刻意把根库放在仓库根目录，暂时不启用 npm workspaces。

## 顶层边界

### 源资产

- `components/`
  所有组件 HTML fragment 和内嵌 manifest 的事实源
- `lib/`
  根库使用的共享 runtime 与 i18n 逻辑
  同时也包含 registry loader 边界、共享 registry 文件名常量、根包导出面契约、查询示例和类型声明契约
  共享的 catalog/query 原语也放在这里，避免根包和 `mcp-server` 各自实现一套搜索、摘要和组件读取逻辑
- `tests/`
  根包级别的冒烟测试

### 生成输出

- `registry/`
  生成得到的 registry、category、tag 和 i18n-report 产物
  其中只有 `registry/.gitkeep` 与 `registry/category-names.json` 被视为受版本控制的输入
- `site/dist/`
  生成得到的静态站点输出
  它的顶层条目由共享站点工具边界定义，并按生成产物校验，而不是手工维护

### 应用与发布面

- 仓库根目录
  可发布 npm 包：`@itkdm/open-lab-components`
- `mcp-server/`
  可发布 npm 包：`@itkdm/open-lab-components-mcp`
  其运行时环境变量、脚本清单、可写路径默认值都显式定义在包内，以保证本地运行与托管部署共享同一契约
  tools、prompts、resources 的注册也通过共享包内清单定义，而不是散落在多个入口脚本里
  CLI / HTTP 启动脚本、发布后的 bin 和文档中的运行命令同样绑定到一套共享入口契约
- `site/`
  预览、文档和 playground 的静态站外壳
  源内容与生成内容边界见 [site/README.md](../site/README.md)

### 工具层

- `tools/build-registry/`
  扫描 `components/` 并生成 registry 产物
- `tools/validate/`
  校验组件结构与 manifest 约束
- `tools/check-registry/`
  验证生成的 registry 是否与源 manifest 一致
- `tools/check-root/`
  根仓库质量入口，串起冒烟测试与校验
- `tools/check-scripts/`
  验证根 `package.json` 的 scripts、publish `files` 边界、共享 package metadata、依赖面和版本契约是否仍与共享清单一致
- `tools/runtime-harness/`
  仅用于 runtime 生命周期验证的隔离 DOM harness
- `tools/build-site/`
  用站点源码和根目录生成资产构建 `site/dist/`
- `tools/dev-site/`
  为静态站和白名单根目录资产提供本地预览
  它与构建脚本、生成产物检查共享同一套站点入口与根目录重发布常量
- `tools/release-smoke/`
  针对两个可发布包的 pack 级 release 校验
  这层还会约束 publishing guide、checklist 和 release command 文档，使其不与脚本和发布边界漂移

## 架构规则

1. `components/` 是组件内容的唯一权威来源。
2. `registry/*.json` 是生成产物，不允许手工编辑。
3. 根包运行时逻辑必须放在 `lib/`，而不是散落在工具脚本中。
4. `mcp-server/` 可以消费根包共享逻辑，但其运行时关注点必须保持在自己的包边界内。
5. `tools/runtime-harness/` 只是质量边界，不是产品包。
6. `mcp-server/data/` 这类运行时数据属于本地运维状态，不纳入版本控制。
7. 受版本控制的文本文件应统一使用 UTF-8 无 BOM 与 LF 换行，和 `.editorconfig`、`.gitattributes` 保持一致。

## 入口命令

### 根库

- `npm run check:text`
- `npm run check:scripts`
- `npm run check:docs`
- `npm run check:generated`
- `npm run check:root`
- `npm run build:registry`
- `npm run build:site`
- `npm run test`

### MCP 包

- `npm run mcp:check:docs`
- `npm run mcp:check:scripts`
- `npm run mcp:test`
- `npm run mcp:test:remote`
- `npm run mcp:start`
- `npm run mcp:start:http`

### 发布校验

- `npm run check:release`
- `npm run release:check`
- `npm run release:pack`

## 当前方向

这个仓库当前优先做的是“收紧边界”，而不是急着做工作区拆分。当前目标是：

- 在根目录维持共享路径和脚本约定
- 明确区分源内容、生成内容和运行时数据
- 稳定 CI 入口与发布前检查路径

等这些边界长期稳定后，再考虑是否迁移到 workspace 结构。
