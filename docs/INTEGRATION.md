# 集成指南（Integration Guide）

> 本文档面向**使用者**——如何在你的项目中嵌入、配置和控制 Open Lab Components。

---

## 1. 获取组件

### 方式一：直接复制

从 `components/` 目录中复制所需的 `.html` 文件到你的项目中。每个文件都是自包含的 HTML 片段，无外部依赖。

### 方式二：通过 Registry 按需加载

`registry/registry.json`（CI 构建产物）包含所有组件的元数据和路径，可用于动态发现和加载：

```js
const registry = await fetch('/path/to/registry.json').then(r => r.json());
const beaker = registry.items.find(c => c.id === 'chem.labware.beaker.graduated.basic');
// beaker.sourcePath → "components/chemistry/labware/chem.labware.beaker.graduated.basic.html"
```

---

## 2. 在原生 HTML 中嵌入

组件是 HTML 片段，直接内联或通过 `fetch` 插入即可。

### 2.1 直接内联

将组件文件内容粘贴到页面中：

```html
<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"></head>
<body>

<!-- 直接粘贴组件内容 -->
<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic" role="img" aria-label="灯泡">
  <!-- ... 组件 SVG/HTML 内容 ... -->
</div>
<style>
  .cmp[data-cmp-id="phy.apparatus.bulb.basic"] { /* ... */ }
</style>

</body>
</html>
```

### 2.2 动态加载

```html
<div id="container"></div>

<script>
async function loadComponent(id, container) {
  // 根据 id 推导路径，或从 registry.json 查找
  const resp = await fetch(`/components/physics/apparatus/phy.apparatus.bulb.basic.html`);
  const html = await resp.text();
  container.innerHTML = html;

  // 重新执行组件内的 <script>（innerHTML 不会自动执行脚本）
  container.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

loadComponent('phy.apparatus.bulb.basic', document.getElementById('container'));
</script>
```

> **注意**：`innerHTML` 插入的 `<script>` 不会自动执行，需要手动重建 script 元素。

---

## 3. 在 React 中嵌入

### 3.1 基础封装

```jsx
import { useRef, useEffect } from 'react';

function LabComponent({ html, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = html;

    // 激活组件内的脚本
    el.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });

    return () => { el.innerHTML = ''; };
  }, [html]);

  // 通过 style 注入 CSS 变量
  useEffect(() => {
    const cmp = containerRef.current?.querySelector('.cmp');
    if (!cmp || !style) return;
    Object.entries(style).forEach(([key, value]) => {
      cmp.style.setProperty(key, String(value));
    });
  }, [style]);

  return <div ref={containerRef} />;
}
```

### 3.2 使用示例

```jsx
function App() {
  const [bulbHtml, setBulbHtml] = useState('');

  useEffect(() => {
    fetch('/components/physics/apparatus/phy.apparatus.bulb.basic.html')
      .then(r => r.text())
      .then(setBulbHtml);
  }, []);

  return (
    <LabComponent
      html={bulbHtml}
      style={{
        '--cmp-size': '120px',
        '--cmp-glow': '0.8',
        '--cmp-accent': '#ffcc00'
      }}
    />
  );
}
```

---

## 4. 在 Vue 中嵌入

### 4.1 基础封装

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  html: { type: String, required: true },
  vars: { type: Object, default: () => ({}) }
});

const container = ref(null);

function render() {
  const el = container.value;
  if (!el || !props.html) return;
  el.innerHTML = props.html;

  // 激活脚本
  el.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });

  applyVars();
}

function applyVars() {
  const cmp = container.value?.querySelector('.cmp');
  if (!cmp) return;
  Object.entries(props.vars).forEach(([key, value]) => {
    cmp.style.setProperty(key, String(value));
  });
}

watch(() => props.html, render);
watch(() => props.vars, applyVars, { deep: true });
onMounted(render);
onUnmounted(() => { if (container.value) container.value.innerHTML = ''; });
</script>
```

### 4.2 使用示例

```vue
<template>
  <LabComponent
    :html="beakerHtml"
    :vars="{
      '--cmp-size': '200px',
      '--cmp-liquid-level': '0.6',
      '--cmp-liquid-color': 'rgba(30, 144, 255, 0.5)'
    }"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LabComponent from './LabComponent.vue';

const beakerHtml = ref('');
onMounted(async () => {
  beakerHtml.value = await fetch('/components/chemistry/labware/chem.labware.beaker.graduated.basic.html')
    .then(r => r.text());
});
</script>
```

---

## 5. 通过 CSS 变量传参

CSS 变量是组件的核心配置机制。每个组件在 Manifest 的 `cssVars` 字段中声明了支持的变量。

### 5.1 查看组件支持的变量

打开组件文件，顶部 Manifest 的 `props` 和 `cssVars` 描述了所有可配置项：

```json
{
  "props": [
    { "key": "size", "type": "number(px)", "default": 120, "desc": "组件尺寸" },
    { "key": "glow", "type": "number(0-1)", "default": 0, "desc": "发光强度" }
  ],
  "cssVars": {
    "size": "--cmp-size",
    "glow": "--cmp-glow"
  }
}
```

### 5.2 注入方式

**方式一：内联 style（最直接）**

```html
<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"
     style="--cmp-size: 96px; --cmp-glow: 0.8; --cmp-accent: #ffcc00"
     role="img" aria-label="灯泡">
  <!-- ... -->
</div>
```

**方式二：通过父容器继承**

```html
<div class="experiment-panel" style="--cmp-stroke: #333; --cmp-stroke-width: 2">
  <!-- 所有子组件继承这些变量 -->
  <div class="cmp" data-cmp-id="phy.apparatus.bulb.basic" ...></div>
  <div class="cmp" data-cmp-id="phy.apparatus.thermometer.basic" ...></div>
</div>
```

**方式三：JavaScript 动态修改**

```js
const cmp = document.querySelector('[data-cmp-id="phy.apparatus.bulb.basic"]');
cmp.style.setProperty('--cmp-glow', '0.5');
cmp.style.setProperty('--cmp-accent', '#ff6600');
```

### 5.3 常用通用变量

| 变量 | 说明 | 典型默认值 |
|------|------|-----------|
| `--cmp-size` | 组件尺寸 | `120px` |
| `--cmp-stroke` | 描边颜色 | `#1a1a1a` |
| `--cmp-stroke-width` | 描边宽度 | `2` |
| `--cmp-accent` | 强调色 | 组件各异 |
| `--cmp-glow` | 发光强度 (0~1) | `0` |

> 所有 CSS 变量都有 fallback 默认值，不设置也能正常渲染。

---

## 6. 通过 data-props 传参（交互组件）

部分交互组件（烧杯、量角器、滑动变阻器等）支持通过 `data-props` 属性传入 JSON 配置：

```html
<div class="cmp" data-cmp-id="chem.labware.beaker.graduated.basic"
     data-props='{"liquidLevel": 0.6, "scaleMin": 0, "scaleMax": 200, "majorStep": 50}'
     role="img" aria-label="烧杯">
  <!-- ... -->
</div>
```

动态更新：

```js
const beaker = document.querySelector('[data-cmp-id="chem.labware.beaker.graduated.basic"]');

// 更新 data-props（组件内部的 MutationObserver 会自动响应）
beaker.setAttribute('data-props', JSON.stringify({
  liquidLevel: 0.8,
  scaleMin: 0,
  scaleMax: 200,
  majorStep: 50
}));
```

> 支持 `data-props` 的组件内部使用 `MutationObserver` 监听属性变化，修改后会自动重新渲染。

---

## 7. 监听交互事件

交互组件在用户操作时通过标准 `CustomEvent` 通知宿主。完整协议见 [`EVENT.md`](./EVENT.md)。

### 7.1 事件类型

| 事件名 | 触发时机 | 说明 |
|--------|---------|------|
| `cmp:change` | 交互过程中持续触发 | 拖拽/旋转/滑动时每帧触发 |
| `cmp:changeend` | 交互结束时触发一次 | 松开鼠标/手指时触发 |

事件 `detail` 结构：

```js
{
  id: "phy.rheostat.slide.interactive",  // 组件 ID
  type: "slide",                          // 交互类型：slide | drag | rotate | toggle | adjust
  values: { ratio: 0.65, resistance: 13 } // 组件特定的数值
}
```

### 7.2 基础监听

```js
// 监听单个组件
const rheostat = document.querySelector('[data-cmp-id="phy.rheostat.slide.interactive"]');

rheostat.addEventListener('cmp:change', e => {
  console.log('滑动中:', e.detail.values);
  // → { ratio: 0.65, resistance: 13 }
});

rheostat.addEventListener('cmp:changeend', e => {
  console.log('滑动结束:', e.detail.values);
});
```

### 7.3 事件代理（推荐）

由于事件设置了 `bubbles: true`，可以在容器上统一监听所有组件：

```js
document.getElementById('lab-container').addEventListener('cmp:change', e => {
  const { id, type, values } = e.detail;
  console.log(`[${id}] ${type}:`, values);
});
```

### 7.4 在 React 中监听

```jsx
function LabComponent({ html, style, onChange, onChangeEnd }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // ... 加载组件 HTML（见第 3 节）...

    const handleChange = e => onChange?.(e.detail);
    const handleEnd = e => onChangeEnd?.(e.detail);
    el.addEventListener('cmp:change', handleChange);
    el.addEventListener('cmp:changeend', handleEnd);
    return () => {
      el.removeEventListener('cmp:change', handleChange);
      el.removeEventListener('cmp:changeend', handleEnd);
    };
  }, [html, onChange, onChangeEnd]);

  return <div ref={containerRef} />;
}
```

### 7.5 在 Vue 中监听

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['change', 'changeend']);
const container = ref(null);

function onCmpChange(e) { emit('change', e.detail); }
function onCmpEnd(e) { emit('changeend', e.detail); }

onMounted(() => {
  container.value.addEventListener('cmp:change', onCmpChange);
  container.value.addEventListener('cmp:changeend', onCmpEnd);
});
onUnmounted(() => {
  container.value?.removeEventListener('cmp:change', onCmpChange);
  container.value?.removeEventListener('cmp:changeend', onCmpEnd);
});
</script>
```

### 7.6 各组件事件 values 速查

| 组件 | type | values 字段 |
|------|------|------------|
| 滑动变阻器 | `slide` | `ratio`, `resistance` |
| 量角器 | `rotate` / `drag` | `angle`, `x`, `y` |
| 杠杆 | `adjust` | `leftDist`, `rightDist`, `leftMass`, `rightMass`, `balanced` |
| 温度计 | `slide` | `temperature` |
| 弹簧测力计 | `slide` | `force` |
| 秒表 | `toggle` | `running`, `elapsed` |
| 凸透镜 | `drag` | `objectDist`, `imageDist` |
| 平面镜 | `drag` | `angle`, `objectDist` |
| 折射演示 | `drag` | `angle` |
| 定滑轮 | `adjust` | `ratio`, `force` |
| 动滑轮 | `adjust` | `ratio`, `force` |
| 滑轮组 | `adjust` | `ratio`, `force` |

> 完整字段说明见 [`EVENT.md`](./EVENT.md)。

---

## 8. 同一页面嵌入多个同类组件

每个组件通过 `data-cmp-id` 实现 CSS 作用域隔离，同类组件可以安全共存：

```html
<!-- 两个灯泡，不同参数 -->
<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"
     style="--cmp-size: 80px; --cmp-glow: 0"
     role="img" aria-label="灯泡（熄灭）">
  <!-- ... -->
</div>

<div class="cmp" data-cmp-id="phy.apparatus.bulb.basic"
     style="--cmp-size: 80px; --cmp-glow: 1"
     role="img" aria-label="灯泡（点亮）">
  <!-- ... -->
</div>
```

> **注意**：包含 `<style>` 的组件如果多次插入，样式会重复。由于选择器完全相同，不会产生冲突，但如果在意体积，可以只保留一份 `<style>` 块。

---

## 9. 常见问题

### 组件加载后脚本没有执行？

通过 `innerHTML` 插入的 `<script>` 不会自动执行。需要手动重建：

```js
container.querySelectorAll('script').forEach(oldScript => {
  const newScript = document.createElement('script');
  newScript.textContent = oldScript.textContent;
  oldScript.replaceWith(newScript);
});
```

### CSS 变量设置了但没生效？

1. 确认变量名拼写正确（查看组件 Manifest 的 `cssVars` 字段）
2. 确认变量设置在组件根节点或其祖先元素上
3. 确认值包含单位（如 `120px` 而非 `120`，具体看 prop 的 type 声明）

### 多个组件的样式互相干扰？

正常情况下不会——所有组件样式都以 `.cmp[data-cmp-id="..."]` 为前缀。如果遇到干扰，检查是否有组件未遵循作用域隔离规范。

### 如何知道一个组件支持哪些参数？

查看组件文件顶部的 `@cmp-manifest` 注释块，`props` 数组列出了所有可配置项及其类型、默认值和说明。也可以通过 `registry.json` 批量查询。
