# 发布说明：locale-aware 元数据与 `cmp-manifest/v2`

这个版本把 Open Lab Components 从“单语言组件库”升级为“支持多语言元数据的组件基础设施”。

## 亮点

- 新增 `cmp-manifest/v2`
- 新增 locale-aware registry 输出
- JS API 新增 `locale` 支持
- MCP server 新增 `locale` 支持
- 站点新增 locale-aware 加载与切换
- 全量组件目录迁移到 `v2` manifest 形态
- 高频学科组件完成一轮英文元数据补齐

## 变更内容

### 1. `cmp-manifest/v2`

组件元数据现在支持：

- `locales["zh-CN"]`
- `locales["en"]`

语言相关字段包括：

- `name`
- `tags`
- `ariaLabel`
- 本地化 prop 标签与描述
- 本地化 event 标签、描述和值说明

语言无关字段仍保留在顶层：

- `id`
- `schema`
- `category`
- `version`
- `viewport`
- `props[].key`
- `cssVars`

### 2. Registry 输出

现在同时发布原始视图和本地化视图：

- `registry/registry.json`
- `registry/registry.zh-CN.json`
- `registry/registry.en.json`
- `registry/categories.zh-CN.json`
- `registry/categories.en.json`
- `registry/tags.zh-CN.json`
- `registry/tags.en.json`

宿主、站点和工具默认应优先使用本地化视图。若字段缺失，再按字段回退到 `zh-CN`。

### 3. JS API

JS API 保持向后兼容，但增加了 `locale` 参数：

```js
const lab = require('@itkdm/open-lab-components');

const zhItems = lab.list();
const enItems = lab.list({}, { locale: 'en' });

const zhComponent = lab.get('phy.optics.lens.convex.interactive');
const enComponent = lab.get('phy.optics.lens.convex.interactive', { locale: 'en' });
```

`readSync`、`read`、`resolve`、`mount`、`updateProps` 的运行时行为保持不变。

### 4. MCP

所有公开 MCP tools 现在都接受可选的 `locale` 参数：

- `get_categories({ locale })`
- `list_components({ category?, tag?, hasEvents?, limit?, locale? })`
- `search_components({ query, category?, limit?, locale? })`
- `get_component({ id, locale? })`

如果不传，服务端默认用 `zh-CN` 解析展示字段。

### 5. 站点

站点当前按以下顺序解析语言：

1. `?lang=`
2. `localStorage`
3. 浏览器语言
4. 默认 `zh-CN`

构建后的站点会携带本地化 registry 产物，因此 UI 切换语言时不需要直接读取组件 manifest。

## 迁移说明

### 从 `cmp-manifest/v1` 迁移

`cmp-manifest/v1` 在过渡期内仍然可读，但新组件应优先使用 `cmp-manifest/v2`。

推荐迁移步骤：

1. 把展示字段迁移到 `locales`
2. 语言无关字段保留在顶层
3. 先补 `zh-CN`
4. 再补 `en`
5. 重新生成 registry 并做校验

### 回退规则

消费者应按字段逐个解析：

- 先尝试请求语言
- 若缺失，则回退到 `zh-CN`

不要假设所有 locale 永远都完整覆盖。

## 验证

本次发布使用以下命令完成验证：

- `npm run release:ready`
- `npm run release:check`
- `npm run release:pack`
- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`

## 对接方建议

- 优先使用 `registry/registry.<locale>.json`
- MCP 客户端显式传入 `locale`
- 宿主侧 `list/get` 也显式传入 `locale`
- 把 `registry/registry.json` 当作原始多语言事实源

## 后续方向

接下来的产品层工作应建立在这套底座上，而不是绕过它：

- scene composition metadata
- scene/runtime APIs
- multilingual experiment demos
- public release packaging and upgrade communication
