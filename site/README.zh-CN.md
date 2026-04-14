# Site Boundary

[English](./README.md) | 中文

## 目的

`site/` 保存公开静态预览站和文档站的源码外壳。

它不是组件元数据或 MCP 能力的事实源。那些能力来自：

- `components/`
- `registry/`
- `docs/`
- `mcp-server/`

站点的职责是重发布和展示这些内容。

## 源内容与生成内容

### 受版本控制的输入

- `site/*.html`
  站点页面入口
- `site/assets/`
  仅供站点使用的静态资源
- `site/` 顶层静态文件
  例如 `logo.png`、`banner.png`、`favicon.ico`

### 生成输出

- `site/dist/`
  由 `npm run build:site` 生成

`site/dist/` 是可丢弃的生成产物，不应作为手工编辑面。

## 外部构建输入

站点构建会把少量仓库根目录下的源码或生成产物重新发布到 `site/dist/`：

- `components/`
- `registry/`
- `docs/`

这些目录在 `site/` 之外仍然是权威来源。

## 构建约定

- `tools/build-site/` 定义站点构建边界
- `tools/dev-site/` 在本地预览时提供 `site/` 以及白名单根目录资源
- 如果新增根目录资源需要在站点中可见，应先更新共享站点工具边界，而不是在某个脚本里单独硬编码路径
