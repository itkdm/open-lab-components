# Open Lab Components

[English](./README.en.md) | 中文

Open Lab Components 是一个面向宿主系统与 AI 客户端的 STEM 教学组件基础设施仓库。它提供 213+ 个零依赖 HTML fragment 组件，并把同一套组件目录同时暴露为：

- 可直接复制使用的 `components/**/*.html`
- 可检索的 `registry/*.json`
- 可编程消费的 JS API
- 可浏览的静态站点
- 可供 Agent 使用的 MCP server

![Open Lab Components 首页](./assets/home.png)

## 项目定位

这个仓库不是通用 UI 组件库，而是面向教育场景的“教学对象组件库”。组件本身来自 `components/`，然后派生出统一的 registry、站点和 MCP 能力，确保开发者、内容平台和 AI 客户端看到的是同一份目录。

## 当前能力

### 组件与数据

- `213` 个组件
- `41` 个分类
- 支持语言：`zh-CN`、`en`
- 默认语言：`zh-CN`
- 兼容 `cmp-manifest/v1`
- 推荐使用 `cmp-manifest/v2`

### JS API

根入口位于 [index.js](./index.js)，公开能力包括：

- `lab.list(filter, { locale })`
- `lab.get(id, { locale })`
- `lab.categories()`
- `lab.readSync(id)`
- `lab.read(id)`
- `lab.resolve(id)`
- `lab.mount(html, container, props)`
- `lab.unmount(container)`
- `lab.updateProps(container, props)`

### MCP server

MCP 实现位于 [mcp-server/](./mcp-server)。当前实现同时支持：

- 本地 `stdio` 模式
- 远程 `Streamable HTTP` 模式
- tools、prompts、resources
- locale-aware 查询与组件读取
- 推荐、反馈、实验页规划与 bundle 组装

当前公开 tools：

- `get_categories`
- `list_components`
- `search_components`
- `recommend_components`
- `submit_recommendation_feedback`
- `get_recommendation_feedback_stats`
- `build_experiment_page`
- `compose_experiment_bundle`
- `get_component`

当前公开 prompts：

- `component-recommendation-brief`
- `component-page-builder`
- `experiment-page-executor`
- `experiment-bundle-integrator`

当前公开 resources：

- `openlab://catalog/overview`
- `openlab://catalog/categories`
- `openlab://catalog/featured`
- `openlab://component/phy.resistor.axial.basic`

详细说明见：

- [docs/MCP.zh-CN.md](./docs/MCP.zh-CN.md)
- [docs/MCP.en.md](./docs/MCP.en.md)
- [mcp-server/README.md](./mcp-server/README.md)
- [mcp-server/README.zh-CN.md](./mcp-server/README.zh-CN.md)

## 快速开始

### 通过 npm 使用

```bash
npm install @itkdm/open-lab-components
```

```js
const lab = require('@itkdm/open-lab-components');

const all = lab.list();
const circuit = lab.list({ category: 'physics/circuit' }, { locale: 'en' });
const battery = lab.get('phy.power.battery.basic', { locale: 'en-US' });
const categories = lab.categories();
const html = lab.readSync('phy.mechanics.projectile.interactive');
```

### 直接复制 HTML fragment

```html
<div
  class="cmp"
  data-cmp-id="phy.resistor.axial.basic"
  style="--cmp-size: 80px; --cmp-body: #caa070;"
>
  <!-- component content -->
</div>
```

### 本地开发

```bash
git clone https://github.com/itkdm/open-lab-components.git
cd open-lab-components
npm install

npm run validate
npm run build:registry
npm run build:site
```

常用命令：

- `npm run dev:site`
- `npm run test:root`
- `npm run mcp:test`
- `npm run check:root`
- `npm run release:ready`

## 仓库结构

```text
components/    组件源码，仓库事实源
registry/      从 components 生成的注册表与分类数据
lib/           根 JS API、i18n、runtime、registry loader
site/          静态展示站源码与 dist 输出
mcp-server/    MCP server 包与远程运行时
tools/         校验、构建、站点、发布检查脚本
docs/          规范、集成、发布与 MCP 文档
tests/         根 API 与契约测试
```

## 生成边界

- `registry/registry.json` 和其他 `registry/*.json` 由 `npm run build:registry` 生成
- `site/dist/` 由 `npm run build:site` 生成
- 不要手工维护上述生成产物中的业务内容

## 文档

- [组件规范](./docs/SPEC.zh-CN.md)
- [分类规则](./docs/CATEGORY.zh-CN.md)
- [事件协议](./docs/EVENT.zh-CN.md)
- [集成指南](./docs/INTEGRATION.zh-CN.md)
- [贡献指南](./docs/CONTRIBUTING.zh-CN.md)
- [部署指南](./docs/DEPLOYMENT.zh-CN.md)
- [MCP 中文文档](./docs/MCP.zh-CN.md)
- [MCP English Docs](./docs/MCP.en.md)

## 许可证

[MIT](./LICENSE)
