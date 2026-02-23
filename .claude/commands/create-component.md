# /create-component — 创建 OLC 组件

你是 Open Lab Components (OLC) 的组件开发专家。用户会描述一个 STEM 教育组件，你需要按照本仓库的规范生成完整的组件文件。

## 输入

用户会提供：`$ARGUMENTS`（组件描述，如"一个可交互的弹簧秤"或"化学烧瓶 basic 版"）

## 工作流程

1. **确认需求**：根据用户描述，确定组件的 id、name、category、variant（basic/interactive/realistic）、需要哪些可配置参数
2. **生成组件文件**：按下方规范生成完整的 `.html` 文件
3. **写入文件**：保存到 `components/{subject}/{domain}/{id}.html`
4. **更新分类名**：如果是新分类，在 `registry/category-names.json` 中添加中英文名称
5. **验证**：运行 `npm run validate` 确认通过
6. **构建**：运行 `npm run build:registry` 更新注册表

---

## 组件规范速查

### 文件结构（严格顺序）

```html
<!-- @cmp-manifest
{ ... JSON ... }
-->
<div class="cmp" data-cmp-id="xxx" role="img" aria-label="中文名称">
  <svg ...>...</svg>
</div>

<script>
(function() { ... })();
</script>

<style>
.cmp[data-cmp-id="xxx"] { ... }
</style>
```

### 硬性规则（违反会被 CI 拒绝）

- **必须是 HTML fragment**：禁止 `<!doctype>`、`<html>`、`<head>`、`<body>`
- **只有一个根节点**：`<div class="cmp" data-cmp-id="..." role="img" aria-label="...">`
- **Manifest 在文件最顶部**：`<!-- @cmp-manifest { ... } -->`，JSON 严格格式（无注释、无尾逗号）
- **Manifest.id 必须与 data-cmp-id 完全一致**
- **零外链**：禁止 `http://`、`https://`、`//`、`@import`
- **CSS 作用域隔离**：所有选择器必须以 `.cmp[data-cmp-id="xxx"]` 开头
- **禁止全局选择器**：不能出现裸 `html`、`body`、`:root`、`*`
- **CSS 变量必须有 fallback**：`var(--cmp-size, 200px)`

### ID 命名规则

格式：`<subject缩写>.<domain>.<name>.<variant>`

| 学科 | 缩写 | 示例 |
|------|------|------|
| 物理 | `phy` | `phy.optics.lens.convex.interactive` |
| 化学 | `chem` | `chem.labware.beaker.graduated.basic` |
| 生物 | `bio` | `bio.organ.heart.basic` |
| 数学 | `math` | `math.geometry.protractor.interactive` |
| 科学 | `sci` | `sci.tool.compass.basic` |

### Category 格式

`subject/domain`，与目录路径对齐：
- `physics/optics` → `components/physics/optics/`
- `chemistry/labware` → `components/chemistry/labware/`
- `biology/organ` → `components/biology/organ/`
- `math/geometry` → `components/math/geometry/`
- `science/tool` → `components/science/tool/`

### Manifest 模板

```json
{
  "schema": "cmp-manifest/v1",
  "id": "phy.xxx.yyy.basic",
  "name": "中文名",
  "nameEn": "English Name",
  "category": "physics/xxx",
  "version": "1.0.0",
  "viewport": { "w": 200, "h": 200 },
  "tags": ["tag1", "tag2", "tag3"],
  "props": [
    { "key": "size", "type": "number(px)", "default": 200, "min": 80, "max": 400, "desc": "组件尺寸" },
    { "key": "stroke", "type": "color", "default": "#1f2937", "desc": "描边颜色" },
    { "key": "strokeWidth", "type": "number", "default": 1.5, "min": 0.5, "max": 4, "desc": "描边宽度" },
    { "key": "glow", "type": "number(0-1)", "default": 0, "min": 0, "max": 1, "desc": "发光强度" }
  ],
  "cssVars": {
    "size": "--cmp-size",
    "stroke": "--cmp-stroke",
    "strokeWidth": "--cmp-stroke-width",
    "glow": "--cmp-glow"
  }
}
```

### Props 类型

| type | 说明 | 示例 |
|------|------|------|
| `number(px)` | 像素值 | `{ "default": 200, "min": 80, "max": 400 }` |
| `number(deg)` | 角度值 | `{ "default": 0, "min": -180, "max": 180 }` |
| `number(0-1)` | 0~1 范围 | `{ "default": 0, "min": 0, "max": 1 }` |
| `number` | 普通数字 | `{ "default": 5, "min": 1, "max": 10 }` |
| `color` | 颜色值 | `{ "default": "#e53935" }` |
| `enum` | 枚举 | `{ "default": "on", "enum": ["on", "off"] }` |
| `string` | 字符串 | `{ "default": "标签文字" }` |

---

## SVG 视觉质量标准

**目标：教育级插图，不是简笔画图标。** 参考 compass（指南针）和 magnifier（放大镜）的质量水平。

### 必须做到

- **渐变**：金属/玻璃/液体等材质必须用 `<linearGradient>` 或 `<radialGradient>` 表现质感
- **高光**：关键表面添加白色半透明高光线/椭圆，模拟光照
- **阴影**：使用 `<feDropShadow>` 或半透明形状做投影，增加层次感
- **细节层次**：至少 3 层视觉层次（底层结构 → 主体 → 高光/装饰）
- **描边**：使用 `stroke-linecap="round"` 和 `stroke-linejoin="round"` 让线条柔和

### 多实例安全

SVG 中的 `<defs>` 内的渐变/滤镜不能用固定 id（多个组件实例会冲突）。使用 class 选择器 + JS 动态分配唯一 id：

```html
<defs>
  <linearGradient class="xx__grad1">...</linearGradient>
</defs>

<script>
(function() {
  var uid = 'xx_' + Math.random().toString(36).slice(2, 8);
  var svg = root.querySelector('svg');
  var grad1 = svg.querySelector('.xx__grad1');
  if (grad1) grad1.setAttribute('id', uid + '_g1');
  // 绑定引用
  someElement.setAttribute('fill', 'url(#' + uid + '_g1)');
})();
</script>
```

### CSS 变量在 SVG 中的用法

直接在 SVG 属性中使用 `var()`：

```xml
<stop offset="0%" stop-color="var(--cmp-rim-color, #b0bec5)"/>
<circle fill="var(--cmp-stroke, #1f2937)"/>
```

---

## JavaScript 规范（交互组件）

### 何时需要 JS

- 拖拽、旋转、滑动等用户交互
- 物理/数学公式计算（如透镜成像公式）
- 动画（蠕动、呼吸、波动等）
- 响应 `data-props` 属性变化

### 标准模板

```html
<script>
(function() {
  var script = document.currentScript;
  if (!script) return;
  var root = script.previousElementSibling;
  if (!root || root.getAttribute('data-cmp-id') !== 'COMPONENT_ID') return;
  var svg = root.querySelector('svg');
  if (!svg) return;

  /* ── 唯一 ID ── */
  var uid = 'PREFIX_' + Math.random().toString(36).slice(2, 8);
  // ... 分配渐变/滤镜 id ...

  /* ── 读取 Props ── */
  function parseProps() {
    var raw = root.getAttribute('data-props');
    if (!raw) return {};
    try { return JSON.parse(raw) || {}; } catch(e) { return {}; }
  }

  function readNum(props, key, cssVar, fallback) {
    if (props[key] !== undefined && isFinite(Number(props[key]))) return Number(props[key]);
    var v = getComputedStyle(root).getPropertyValue(cssVar).trim();
    var n = parseFloat(v);
    return isFinite(n) ? n : fallback;
  }

  function readColor(props, key, cssVar, fallback) {
    if (props[key]) return props[key];
    var v = getComputedStyle(root).getPropertyValue(cssVar).trim();
    return v || fallback;
  }

  /* ── 事件派发 ── */
  function emitChange(type, values) {
    root.dispatchEvent(new CustomEvent('cmp:change', {
      bubbles: true, composed: true,
      detail: { id: root.getAttribute('data-cmp-id'), type: type, values: values }
    }));
  }

  function emitChangeEnd(type, values) {
    root.dispatchEvent(new CustomEvent('cmp:changeend', {
      bubbles: true, composed: true,
      detail: { id: root.getAttribute('data-cmp-id'), type: type, values: values }
    }));
  }

  /* ── 渲染 ── */
  function render() {
    var props = parseProps();
    // ... 读取参数、更新 SVG ...
  }

  render();

  /* ── 监听属性变化 ── */
  var observer = new MutationObserver(function() { render(); });
  observer.observe(root, { attributes: true, attributeFilter: ['style', 'data-props'] });
  window.addEventListener('beforeunload', function() { observer.disconnect(); }, { once: true });
})();
</script>
```

### 交互事件协议

| 事件名 | 触发时机 |
|--------|---------|
| `cmp:change` | 交互过程中持续触发（如拖拽每一帧） |
| `cmp:changeend` | 交互结束时触发一次（如 pointerup） |

detail 结构：`{ id: string, type: string, values: object }`

type 取值：`slide`（单轴滑动）、`drag`（二维拖拽）、`rotate`（旋转）、`toggle`（开关）、`adjust`（多参数联动）

如果组件有事件，在 Manifest 中声明 `events` 字段：

```json
"events": [
  {
    "name": "cmp:change",
    "type": "slide",
    "values": { "position": "number(0-1)", "resistance": "number(Ω)" }
  }
]
```

---

## CSS 模板

```css
.cmp[data-cmp-id="xxx"] {
  --_size: var(--cmp-size, 200px);
  display: inline-block;
  width: var(--_size);
  height: var(--_size);
  user-select: none;
}

.cmp[data-cmp-id="xxx"] svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
```

---

## 完成后检查清单

生成组件后，自检以下项目：

- [ ] 文件是 HTML fragment（无 doctype/html/head/body）
- [ ] 只有一个根节点，带 `class="cmp"`、`data-cmp-id`、`role="img"`、`aria-label`
- [ ] Manifest 在文件顶部，JSON 可解析，schema 为 `cmp-manifest/v1`
- [ ] Manifest.id 与 data-cmp-id 一致
- [ ] 无外链资源
- [ ] CSS 选择器全部以 `.cmp[data-cmp-id="xxx"]` 开头
- [ ] CSS 变量都有 fallback 值
- [ ] SVG 渐变/滤镜使用 class + JS 动态 id（多实例安全）
- [ ] SVG 有渐变、高光、阴影（不是简笔画）
- [ ] 如有 JS：IIFE 包裹、无全局变量、只操作自己的 DOM
- [ ] 如有交互：派发 `cmp:change` / `cmp:changeend` 事件
- [ ] 运行 `npm run validate` 通过
- [ ] 运行 `npm run build:registry` 更新注册表
