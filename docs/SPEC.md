# 组件协议（Component Spec）v1

> 本协议用于约束仓库内 **单组件 HTML fragment** 的结构、可配置方式与质量标准。
>
> **合并门禁**：任意 PR 若不满足本协议的“必须/禁止”条款，将被 CI 拒绝合并。

---

## 0. 目标

为“器材/元件组件库”提供统一的最小标准，使：

- **单组件足够短小精悍**（低负重、便于复用）
- **统一样式与可配置机制**（避免每个组件自带一堆背景/字体/布局）
- **可被宿主系统组合**为完整实验页面（宿主负责页面布局/背景/说明文案等）

> 组件文件只负责“器材长什么样 + 哪些参数可调 + 参数如何映射到视觉”，不负责页面布局、背景、字号、说明文案等。

---

## 1. 范围与术语

- **组件文件**：位于 `components/**` 下的单个 `.html` 文件。
- **HTML fragment**：不包含 `<!doctype html> / <html> / <head> / <body>` 的片段。
- **Manifest**：写在组件文件顶部的 `<!-- @cmp-manifest ... -->` JSON 元数据块，用于检索、渲染与参数注入。
- **宿主**：最终承载组件的业务系统/编辑器/画布。

---

## 2. 文件与输出形态（必须/禁止）

### 2.1 必须（MUST）

1. 组件文件必须是 **HTML fragment**（仅输出组件本体）。
2. 一个组件文件 **只定义一个组件**。
3. 组件文件内必须存在且仅存在 **一个根节点**（组件根容器）。

### 2.2 禁止（MUST NOT）

1. 禁止输出完整页面结构：`<!doctype html><html><head><body>` 等。
2. 禁止引入外链资源：外部 CSS/JS、图片 URL、字体 URL（`http://` / `https://` / `//` / `@import` 等）。
3. 禁止依赖宿主页面的全局样式（必须自洽）。

---

## 3. Manifest（必须）

### 3.1 位置与格式

- Manifest 必须放在文件最顶部，使用注释块包裹：
  - `<!-- @cmp-manifest`
  - JSON
  - `-->`
- JSON 必须可被严格解析（不允许注释、尾逗号）。

### 3.2 Schema 与字段

Manifest 顶层字段（v1）：

- `schema`（必须）：固定为 `"cmp-manifest/v1"`
- `id`（必须）：全局唯一，例如 `phy.resistor.axial.basic`
- `name`（必须）：中文名
- `nameEn`（建议）：英文名，用于国际化显示
- `category`（必须）：`subject/domain` 形式，例如 `physics/circuit`
- `version`（必须）：SemVer，例如 `1.0.0`
- `viewport`（建议）：`{ "w": 64, "h": 64 }`，用于默认预览比例
- `tags`（建议）：标签数组，用于搜索过滤
- `props`（建议）：可配置项声明（用于宿主生成调参面板）
- `cssVars`（建议）：该组件支持的 CSS 变量声明（用于宿主注入/文档展示）

### 3.3 props 与 cssVars 规范

**props（建议但强烈推荐）**：每个条目包含：

- `key`：参数名（例如 `size`）
- `type`：如 `number(px)` / `number(0-1)` / `color` / `enum(...)`
- `default`：默认值
- `min/max`：可选
- `desc`：说明

**cssVars（建议）**：对象格式，键为 prop 的 key，值为对应的 CSS 变量名（包含 `--` 前缀）。

例如：
```json
{
  "size": "--cmp-size",
  "stroke": "--cmp-stroke",
  "glow": "--cmp-glow"
}
```

这种方式建立 props 到 CSS 变量的映射，方便宿主系统自动将 props 值注入到对应的 CSS 变量中。

### 3.4 Manifest 示例

```html
<!-- @cmp-manifest
{
  "schema": "cmp-manifest/v1",
  "id": "phy.meter.voltage.draggable",
  "name": "电压表（可拖拽）",
  "category": "physics/circuit",
  "version": "1.0.0",
  "viewport": { "w": 120, "h": 120 },
  "tags": ["voltmeter", "meter", "circuit", "draggable"],
  "props": [
    { "key": "size", "type": "number(px)", "default": 120, "min": 48, "max": 360, "desc": "组件尺寸（正方形）" }
  ],
  "cssVars": {
    "size": "--cmp-size"
  }
}
-->
```

---

## 4. DOM 契约（必须）

组件根节点必须满足：

- `class="cmp"`
- `data-cmp-id="..."` 与 Manifest.id 完全一致
- `role="img"` 且 `aria-label="组件名称"`

示例：

```html
<div class="cmp" data-cmp-id="phy.resistor.axial.basic" role="img" aria-label="电阻（轴向）">
  <!-- svg / div 结构 -->
</div>
```

---

## 5. 样式规范（强制）

### 5.1 必须（MUST）

1. 样式必须内联在组件文件中（`<style>...</style>`），不得外链。
2. 所有 CSS 选择器必须 **以组件根作用域前缀** 限定，避免污染宿主：
   - 推荐：`.cmp[data-cmp-id="..."] ...`
3. 视觉参数必须通过 **CSS 变量** 可被宿主覆盖（见 5.3）。

### 5.2 禁止（MUST NOT）

1. 禁止任何全局选择器：`html` / `body` / `:root` / `*`（除非被组件根前缀限定）。
2. 禁止设置宿主背景、页面字体、全局字号、页面布局等与“组件本体”无关的内容。

### 5.3 推荐的 CSS 变量（可扩展）

通用视觉 token（建议每个组件尽量复用这些命名）：

- `--cmp-size`：组件尺寸（正方形）
- `--cmp-stroke`：描边颜色
- `--cmp-stroke-width`：描边宽度
- `--cmp-accent`：强调色
- `--cmp-glow`：强调/发光强度（0~1）
- `--cmp-shadow`：阴影强度（如需要）

写法要求：

- 必须使用 `var(--xxx, fallback)` 提供 fallback，保证组件自洽。
- 宿主可通过根节点 `style` 覆盖变量，例如：
  - `<div class="cmp" ... style="--cmp-size:96px;--cmp-accent:#ffcc00"></div>`

---

## 6. JS 规范（默认禁止；确有必要才允许）

### 6.1 默认规则

- **能用 CSS/HTML 实现就不要 JS**。

### 6.2 允许 JS 的条件（同时满足）

1. 组件必须确有交互需求（拖拽、旋转、指针指示等）。
2. JS 必须 **完全自包含**：IIFE 包裹，不向 `window` 挂载任何变量/函数。
3. JS 只能查询/操作自己的根节点内部 DOM。
4. 禁止网络请求；禁止读取/写入宿主敏感数据；禁止永久运行的定时器。

### 6.3 交互事件协议（建议）

交互组件应通过 `CustomEvent` 通知宿主状态变化，详见 [`docs/EVENT.md`](./EVENT.md)。

- 事件名：`cmp:change`（过程中持续触发）、`cmp:changeend`（交互结束时触发一次）
- 事件必须 `bubbles: true, composed: true`
- `detail` 结构：`{ id, type, values }`
- Manifest 中应声明 `events` 字段描述组件支持的事件

建议模式：

```html
<script>
(() => {
  const root = document.currentScript?.previousElementSibling; // 或通过 data-cmp-id 查询
  if (!root) return;
  // 仅操作 root 内部
})();
</script>
```

---

## 7. 可访问性（建议但成本极低）

- 根节点 `role="img"` + `aria-label`
- 重要可交互元素（如旋钮）应具备合理的 `aria-*`（可选）

---

## 8. 质量检查清单（交付前自检）

提交 PR 前请确保：

- [ ] 组件是 HTML fragment（无 doctype/html/head/body）
- [ ] 仅一个根节点，且带 `class="cmp"`、`data-cmp-id`、`role`、`aria-label`
- [ ] Manifest 存在且 JSON 可解析
- [ ] Manifest.id 与 data-cmp-id 一致
- [ ] 无外链资源（无 http/https/@import 等）
- [ ] CSS 作用域已隔离（无全局选择器污染）
- [ ] 关键可配置项已用 CSS 变量暴露，且提供 fallback
- [ ] 若有 JS：IIFE 自包含、无全局污染、无网络请求

---

## 9. 版本与兼容

- v1 的 schema 固定为 `cmp-manifest/v1`
- 不兼容变更必须升级 schema（例如 v2），并在仓库 `docs/` 内提供迁移说明
