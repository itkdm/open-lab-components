# 交互事件协议（Event Protocol）v1

> 本协议为交互类组件定义统一的事件通知机制，使宿主系统能以一致的方式监听和响应组件状态变化。

---

## 1. 设计原则

- **最小侵入**：事件协议是对现有 CSS 变量 + data-props 机制的补充，不替代它们
- **统一接口**：所有交互组件使用相同的事件名和 detail 结构
- **可选采纳**：宿主可以选择监听事件，也可以继续用 MutationObserver 等方式——事件是便利层，不是唯一通道
- **冒泡传播**：事件冒泡到 document，宿主可在任意祖先节点上委托监听

---

## 2. 事件名称

所有交互组件统一使用以下事件名（`cmp:` 命名空间）：

| 事件名 | 触发时机 | 说明 |
|--------|---------|------|
| `cmp:change` | 交互过程中，值发生变化时 | 拖拽滑动中持续触发（类似 `input` 事件） |
| `cmp:changeend` | 一次交互结束时 | 松开鼠标/手指时触发一次（类似 `change` 事件） |

> 为什么用冒号分隔？与 DOM 原生事件（`click`、`change`）区分，避免命名冲突，同时保持简洁。

---

## 3. detail 结构

事件通过 `CustomEvent` 的 `detail` 属性携带数据：

```js
event.detail = {
  id: "phy.rheostat.slide.interactive",  // 组件 ID（string）
  type: "slide",                          // 交互类型（string）
  values: {                               // 当前状态值（object）
    position: 0.72,
    resistance: 36.0
  }
}
```

### 3.1 字段说明

| 字段 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 组件的 `data-cmp-id`，用于区分事件来源 |
| `type` | string | 是 | 交互类型，见下表 |
| `values` | object | 是 | 键值对，包含当前所有可观测状态 |

### 3.2 交互类型（type）

| type | 含义 | 典型组件 |
|------|------|---------|
| `slide` | 单轴滑动（水平或垂直） | 滑动变阻器、温度计、弹簧秤、量筒 |
| `drag` | 二维拖拽定位 | 量角器（拖拽模式）、电压表探针、导线夹 |
| `rotate` | 旋转 | 量角器（旋转模式） |
| `toggle` | 开关切换 | 计时器启停 |
| `adjust` | 多参数联动调节 | 杠杆（拖拽力臂）、滑轮组 |

### 3.3 values 约定

- 键名与组件 Manifest 的 `props` 中的 `key` 对齐
- 数值类型保持与 props 声明一致（如 `number(0-1)` 则值域为 0~1）
- 派生值（如电阻值 = position × maxR）也应包含，方便宿主直接使用
- 所有数值保留合理精度（建议最多 2 位小数）

---

## 4. 事件创建与派发

### 4.1 标准写法

```js
function emitChange(root, type, values) {
  root.dispatchEvent(new CustomEvent('cmp:change', {
    bubbles: true,
    composed: true,
    detail: {
      id: root.getAttribute('data-cmp-id'),
      type: type,
      values: values
    }
  }));
}

function emitChangeEnd(root, type, values) {
  root.dispatchEvent(new CustomEvent('cmp:changeend', {
    bubbles: true,
    composed: true,
    detail: {
      id: root.getAttribute('data-cmp-id'),
      type: type,
      values: values
    }
  }));
}
```

### 4.2 触发时机

- `cmp:change`：在交互过程中每次状态更新时触发（如拖拽的每一帧）
- `cmp:changeend`：在交互结束时触发一次（如 `pointerup`）
- 对于 `toggle` 类型，只触发 `cmp:change`（状态切换是瞬时的，无"过程"）

### 4.3 性能考虑

- `cmp:change` 在拖拽过程中可能高频触发，宿主如需降频可自行 throttle/debounce
- 组件内部不做节流，保证状态实时性

---

## 5. Manifest 扩展

交互组件应在 Manifest 中声明 `events` 字段：

```json
{
  "events": [
    {
      "name": "cmp:change",
      "type": "slide",
      "values": {
        "position": "number(0-1) — 滑块位置",
        "resistance": "number(Ω) — 当前电阻值"
      }
    },
    {
      "name": "cmp:changeend",
      "type": "slide",
      "values": {
        "position": "number(0-1) — 滑块位置",
        "resistance": "number(Ω) — 当前电阻值"
      }
    }
  ]
}
```

> `events` 字段为建议字段，不影响校验通过。它的作用是让宿主系统和开发者能从 Manifest 中发现组件支持哪些事件。

---

## 6. 宿主监听示例

### 6.1 直接监听单个组件

```js
const rheostat = document.querySelector('[data-cmp-id="phy.rheostat.slide.interactive"]');

rheostat.addEventListener('cmp:change', (e) => {
  console.log('电阻变化:', e.detail.values.resistance, 'Ω');
});

rheostat.addEventListener('cmp:changeend', (e) => {
  console.log('调节完成:', e.detail.values.resistance, 'Ω');
});
```

### 6.2 委托监听所有组件

```js
document.addEventListener('cmp:change', (e) => {
  const { id, type, values } = e.detail;
  console.log(`[${id}] ${type}:`, values);
});
```

### 6.3 在 React 中监听

```jsx
useEffect(() => {
  const el = containerRef.current?.querySelector('.cmp');
  if (!el) return;

  const handler = (e) => {
    const { values } = e.detail;
    setResistance(values.resistance);
  };

  el.addEventListener('cmp:change', handler);
  return () => el.removeEventListener('cmp:change', handler);
}, []);
```

### 6.4 在 Vue 中监听

```js
onMounted(() => {
  const el = container.value?.querySelector('.cmp');
  el?.addEventListener('cmp:change', (e) => {
    state.value = e.detail.values;
  });
});
```

---

## 7. 各组件事件清单

| 组件 ID | type | values 键 | 说明 |
|---------|------|-----------|------|
| `phy.rheostat.slide.interactive` | `slide` | `position`, `resistance` | 滑块位置和电阻值 |
| `phy.apparatus.thermometer.interactive` | `slide` | `temperature` | 温度值 |
| `phy.apparatus.spring-scale.interactive` | `slide` | `force` | 弹力值 (N) |
| `phy.apparatus.cylinder.graduated` | `slide` | `volume` | 液面体积 (mL) |
| `phy.apparatus.protractor.interactive` | `rotate` / `drag` | `angle` / `x`, `y` | 旋转角度 / 位置坐标 |
| `phy.mechanics.lever.interactive` | `adjust` | `l1`, `l2`, `torque1`, `torque2`, `balanced` | 力臂比和力矩 |
| `phy.apparatus.pulley-fixed.interactive` | `adjust` | `ratio`, `force` | 拉绳比例和力 |
| `phy.apparatus.pulley-movable.interactive` | `adjust` | `ratio`, `force` | 拉绳比例和力 |
| `phy.apparatus.pulley-system.interactive` | `adjust` | `ratio`, `force` | 拉绳比例和力 |
| `phy.apparatus.timer.interactive` | `toggle` | `running`, `elapsed` | 运行状态和已计时间 |
| `phy.optics.lens.convex.interactive` | `slide` | `objectDist`, `imageDist` | 物距和像距 |
| `phy.optics.mirror.plane.interactive` | `slide` | `angle` | 入射角 |
| `phy.optics.refraction.interactive` | `slide` | `angle` | 入射角 |

---

## 8. 版本与兼容

- 本协议版本为 v1，与 `cmp-manifest/v1` 配套
- 事件协议是增量扩展，不破坏现有组件的向后兼容性
- 未来如需扩展（如双向绑定、状态同步），将在 v2 中定义
