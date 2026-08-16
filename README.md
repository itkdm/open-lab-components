<div align="center">

# 🔬 Open Lab Components

<p>
  <a href="./README.en.md">English</a> | <b>中文</b>
</p>

<p>
  <a href="https://www.npmjs.com/package/@itkdm/open-lab-components"><img src="https://img.shields.io/npm/v/@itkdm/open-lab-components.svg" alt="npm version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg" alt="node"></a>
</p>

<p>
  <strong><a href="http://olc.itkdm.com">🌐 在线演示网站: olc.itkdm.com</a></strong>
</p>

<p><strong>面向宿主系统与 AI 客户端的 STEM 教学组件基础设施。</strong></p>

<p><em>一套组件目录，同时服务 HTML 复用、注册表检索、JS API 调用、静态站浏览与 MCP Agent 集成。</em></p>

<br/>

<img src="./assets/home.png" alt="Open Lab Components 首页" width="100%" />

</div>

## 一眼看懂

| 图标 | 能力面 | 说明 |
| --- | --- | --- |
| ![HTML Fragment](https://img.shields.io/badge/HTML-Fragment-E34F26?logo=html5&logoColor=white) | 组件片段 | 零依赖 HTML 片段，可直接嵌入宿主页面。 |
| ![Registry JSON](https://img.shields.io/badge/Registry-JSON-000000?logo=json&logoColor=white) | 结构化目录 | 支持分类、检索、筛选与 catalog 构建。 |
| ![JS API](https://img.shields.io/badge/JavaScript-API-F7DF1E?logo=javascript&logoColor=black) | 程序化接入 | 通过 `lab.*` 方法查询、读取与挂载组件。 |
| ![Static Site](https://img.shields.io/badge/Docs-Site-0EA5E9?logo=readthedocs&logoColor=white) | 可视化站点 | 面向内容同学和开发者的浏览与演示入口。 |
| ![MCP Server](https://img.shields.io/badge/MCP-Agent%20Server-2563EB?logo=nodedotjs&logoColor=white) | Agent 集成 | 为 AI 提供 tools、prompts、resources 接口。 |

## 📚 目录

- [💡 为什么选择 Open Lab Components](#💡-为什么选择-open-lab-components)
- [🎯 适用场景](#🎯-适用场景)
- [🚀 能力总览](#🚀-能力总览)
- [🔄 架构闭环](#🔄-架构闭环)
- [⚡ 快速开始](#⚡-快速开始)
- [🤖 MCP 能力一览](#🤖-mcp-能力一览)
- [📁 仓库结构](#📁-仓库结构)
- [💻 常用开发命令](#💻-常用开发命令)
- [🚧 生成产物边界](#🚧-生成产物边界)
- [🗺️ 文档导航](#🗺️-文档导航)
- [💬 联系与支持](#💬-联系与支持)
- [❓ 常见问题](#❓-常见问题)
- [📄 许可证](#📄-许可证)

## 💡 为什么选择 Open Lab Components

这不是通用 UI 组件库，而是教育场景下的“教学对象组件库”。

- 单一事实源：`components/` 是唯一事实源。
- 多端一致性：registry、站点、JS API、MCP 都从同一目录派生。
- 面向 AI 友好：提供结构化 metadata、可检索能力和 Agent 可调用接口。

## 🎯 适用场景

| 角色 | 典型诉求 | 推荐入口 |
| --- | --- | --- |
| 教学内容平台 | 快速拼装实验页、避免重复造轮子 | `registry/*.json` + `components/**/*.html` |
| 前端开发者 | 在业务页中嵌入教学组件并动态更新参数 | `index.js` 的 `lab.mount / lab.updateProps` |
| AI Agent / 助教助手 | 自动推荐组件并生成实验页面 | MCP tools + prompts |
| 课程设计者 | 查找分类、比对组件、形成实验方案 | 静态站 + catalog resources |

## 🚀 能力总览

| 维度 | 当前状态 |
| --- | --- |
| 组件规模 | `213+` 个组件（持续增长） |
| 分类数量 | `41` 个分类 |
| 多语言 | `zh-CN`、`en` |
| 默认语言 | `zh-CN` |
| Manifest | 兼容 `cmp-manifest/v1`，推荐 `cmp-manifest/v2` |
| Node 要求 | `>=18.0.0` |

### 你可以获得什么

- 可直接复制的零依赖 HTML fragment 组件。
- 可供程序检索与筛选的结构化 registry 数据。
- 可在 Node 与浏览器中复用的统一 JS API。
- 可被 Agent 调用的 MCP 工具、提示词与资源。

## 🔄 架构闭环

```text
components/ (事实源)
  |
  +--> registry/*.json (结构化目录)
  +--> lib + index.js (程序化 API)
  +--> site/ (可视化浏览与演示)
  +--> mcp-server/ (Agent 可调用能力)
```

这意味着：新增或更新组件时，开发者端、内容平台端和 AI 端看到的是同一份组件事实，不会出现目录漂移。

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

## ⚡ 快速开始

无论是不懂代码的普通个人/老师，还是专业的前端开发者，都能轻松上手。

### 👨‍🏫 普通用户或创作者：在演示网站体验

你不必编写任何代码代码。只需访问我们的 **可视化静态演示站**（若无部署链接，可本地执行 `npm run dev:site` 启动），即可：
1. **浏览组件**：直观查看化学、物理、生物等各学科的可交互教学组件。
2. **实时调节**：在右侧配置面板中修改初始参数（如电阻阻值、受力大小），即时查看组件效果。
3. **组合与复用**：调整满意后，点击“复制所需片段”，将 HTML 结构直接粘贴到你自己的教案、博客或支撑平台中。

### 🧑‍💻 前端开发者：集成到自己的 Web 项目中

如果你需要在项目里动态挂载和控制这些组件，只需简单的几步：

**1) 安装依赖：**
```bash
npm install @itkdm/open-lab-components
```

**2) 准备 HTML 挂载点（你可以直接从演示站复制这一段）：**
```html
<div
  class="cmp"
  data-cmp-id="phy.resistor.axial.basic"
  style="--cmp-size: 80px; --cmp-body: #caa070;"
>
  <!-- 组件DOM将被挂载于此 -->
</div>
```

**3) 通过 JS API 获取并挂载组件（支持按需更新参数）：**
```js
const lab = require('@itkdm/open-lab-components');

const categories = lab.categories();
const circuit = lab.list({ category: 'physics/circuit' }, { locale: 'en' });
const battery = lab.get('phy.power.battery.basic', { locale: 'en-US' });

// 获取你的目标容器
const container = document.querySelector('.cmp');
// 读取组件的原始HTML模板
const componentHtml = lab.readSync('phy.resistor.axial.basic');

// 将模板挂载到DOM容器中，并提供初始化参数
lab.mount(componentHtml, container, { resistance: 100 });

// 在业务交互中，随时动态更新它的状态！
lab.updateProps(container, { resistance: 200 });
```

**4) 使用 Registry 查询能力：**
```js
// 动态获取物理电路分类下的所有组件（支持本地化）
const circuitZh = lab.list({ category: 'physics/circuit' }, { locale: 'zh-CN' });
```

### 🛠️ 仓库贡献者：本地参与开发

```bash
git clone https://github.com/itkdm/open-lab-components.git
cd open-lab-components
npm install

# 确保产物生成，并启动站点
npm run build
npm run dev:site
```

## 🤖 MCP 能力一览

MCP 实现位于 [mcp-server/](./mcp-server)，支持本地 `stdio` 与远程 `Streamable HTTP` 两种模式。

| 能力类型 | 已公开 |
| --- | --- |
| tools | `get_categories`, `list_components`, `search_components`, `recommend_components`, `submit_recommendation_feedback`, `get_recommendation_feedback_stats`, `build_experiment_page`, `compose_experiment_bundle`, `get_component` |
| prompts | `component-recommendation-brief`, `component-page-builder`, `experiment-page-executor`, `experiment-bundle-integrator` |
| resources | `openlab://catalog/overview`, `openlab://catalog/categories`, `openlab://catalog/featured`, `openlab://component/phy.resistor.axial.basic` |

更多说明：

- [docs/MCP.zh-CN.md](./docs/MCP.zh-CN.md)
- [docs/MCP.en.md](./docs/MCP.en.md)
- [mcp-server/README.md](./mcp-server/README.md)
- [mcp-server/README.zh-CN.md](./mcp-server/README.zh-CN.md)

## 📁 仓库结构

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

## 💻 常用开发命令

| 目标 | 命令 |
| --- | --- |
| 全量校验与构建 | `npm run validate && npm run build` |
| 构建注册表 | `npm run build:registry` |
| 构建站点 | `npm run build:site` |
| 本地预览站点 | `npm run dev:site` |
| 根 API 测试 | `npm run test:root` |
| MCP 测试 | `npm run mcp:test` |
| 发布前检查 | `npm run release:ready` |
| 根目录检查 | `npm run check:root` |

## 🚧 生成产物边界

- `registry/registry.json` 及其他 `registry/*.json` 由 `npm run build:registry` 生成。
- `site/dist/` 由 `npm run build:site` 生成。
- 请勿在生成产物中手工维护业务内容。

## 🗺️ 文档导航

- 规范与集成：
[组件规范](./docs/SPEC.zh-CN.md) · [分类规则](./docs/CATEGORY.zh-CN.md) · [事件协议](./docs/EVENT.zh-CN.md) · [集成指南](./docs/INTEGRATION.zh-CN.md)
- 协作与发布：
[贡献指南](./docs/CONTRIBUTING.zh-CN.md) · [部署指南](./docs/DEPLOYMENT.zh-CN.md) · [发布流程](./docs/RELEASE-CHECKLIST-0.2.0.zh-CN.md)
- MCP：
[MCP 中文文档](./docs/MCP.zh-CN.md) · [MCP English Docs](./docs/MCP.en.md)

## 💬 联系与支持

如果这个项目对你有帮助，欢迎通过以下方式联系与支持。

![Alipay](https://img.shields.io/badge/Alipay-支持-1677FF?logo=alipay&logoColor=white)
![WeChat](https://img.shields.io/badge/WeChat-联系-07C160?logo=wechat&logoColor=white)

<table>
  <tr>
    <td align="center" width="50%">
      <strong>支付宝付款码</strong><br />
      <img src="./assets/alipay.png" alt="支付宝付款码" width="260" />
    </td>
    <td align="center" width="50%">
      <strong>微信联系方式 / 支持码</strong><br />
      <img src="./assets/wechat-pay.png" alt="微信联系方式二维码" width="260" />
    </td>
  </tr>
</table>

## ❓ 常见问题

### Q1: 可以直接编辑 registry 里的 JSON 吗？

不建议。`registry/*.json` 属于生成产物，应通过维护 `components/` 并执行构建脚本来更新。

### Q2: 为什么 MCP 和 JS API 会看到同一套组件？

因为二者都基于统一的组件事实源和生成流程，避免了多份目录手工维护导致的不一致。

### Q3: 适合放到生产系统吗？

可以。建议在接入流程中固定版本、加入 `npm run validate` 与回归测试，确保升级可控。

## 📄 许可证

[MIT](./LICENSE)
