# 展示场景与接入说明

[English](./SHOWCASE.en.md) | 中文

这份说明用于整理 Open Lab Components 在正式推广前最容易展示的接入路径。它优先覆盖低成本场景，复用现有组件目录、registry 数据、静态站和 MCP 能力，不修改组件源码。

## 推荐入口

| 场景 | 推荐入口 | 为什么适合 |
| --- | --- | --- |
| 老师或内容同学预览 | `site/` | 先可视化浏览和对比组件，再决定是否复用片段。 |
| LMS 或内容平台接入 | `registry/*.json` + `components/**/*.html` | 元数据和 HTML fragment 分离，宿主系统可以保留自己的页面结构。 |
| 前端工程集成 | `index.js` | 用统一 JS API 查询、读取、挂载、卸载和更新组件。 |
| AI 助教或 Agent 流程 | `mcp-server/` | 让 Agent 检索、推荐组件，并组装实验页 bundle。 |
| 教学可视化素材 | `visuals/` | 与 HTML 组件一起复用学科示意图、知识结构图和流程图。 |

## 推广演示流程

1. 执行 `npm run build`，刷新 registry 数据和静态站产物。
2. 执行 `npm run dev:site`，打开本地预览站。
3. 选择一个物理交互组件、一个化学或生物组件、一个可视化素材，展示跨学科覆盖。
4. 展示对应 registry 条目，说明组件事实源和结构化目录如何对应。
5. 面向 AI 场景时，启动 MCP server，请 Agent 推荐组件或组装实验页 bundle。

## 接入注意

- 把 `components/` 当作作者维护入口，把 `registry/` 当作生成的结构化目录。
- 宿主页面布局、课程文案和全局样式应留在宿主系统，不写进组件 fragment。
- 构建双语体验时，优先使用 JS API 或 MCP tools 的 `locale` 参数。
- 内容审核适合走静态站，生产系统集成适合走 JS API 或 MCP server。

## 验证命令

分享演示分支前建议执行：

```bash
npm run validate
npm run build:registry
npm run check:registry
npm run build:site
npm run check:root
```
