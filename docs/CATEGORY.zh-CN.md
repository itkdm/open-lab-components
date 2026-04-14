# 分类与命名规则（CATEGORY）

本文件定义组件的 **目录结构 / category / id / tags** 的统一规则，避免组件增多后失控。

---

## 1. category（主分类，单选）

### 1.1 格式

- 固定为两段：`subject/domain`
- 示例：`physics/apparatus`、`physics/circuit`

### 1.2 与目录映射（强烈建议）

组件路径建议与 category 对齐：

- `physics/apparatus` → `components/physics/apparatus/`
- `physics/circuit`   → `components/physics/circuit/`

> 这样做可让“按目录浏览”和“按 category 检索”完全一致。

### 1.3 推荐的初始分类集合（可扩展）

- physics/apparatus（物理器材：灯泡、砝码、滑轮等）
- physics/circuit（电路元件与仪表：电阻、电压表、电流表等）
- chemistry/labware（化学器皿：烧杯、试管、酒精灯等）
- chemistry/substance（化学物质/分子：元素、分子模型等）
- biology/model（生物结构模型：细胞、器官结构等）
- math/geometry（几何图形/量具）
- general/ui（通用 UI/标注控件：箭头、标尺、标签等）

### 1.4 分类的中英文名称（国际化支持）

为了支持多语言显示和 AI 理解，每个分类都有对应的中英文名称。分类名称定义在 `registry/category-names.json` 文件中：

```json
{
  "schema": "cmp-category-names/v1",
  "categories": {
    "physics/apparatus": {
      "name": "物理器材",
      "nameEn": "Physics Apparatus"
    },
    "physics/circuit": {
      "name": "电路元件",
      "nameEn": "Circuit Components"
    }
  }
}
```

**说明**：
- `name`：中文名称，用于国内用户显示
- `nameEn`：英文名称，用于国际用户显示和 AI 理解
- 构建脚本会自动读取此文件，并在生成的 `registry.json` 和 `categories.json` 中包含分类的中英文名称
- 前端页面会根据用户选择的语言自动显示对应的分类名称

**添加新分类**：
1. 在组件中使用新的 category 值（如 `chemistry/labware`）
2. 在 `registry/category-names.json` 中添加对应的中英文名称
3. 运行 `npm run build:registry` 重新生成注册表

---

## 2. id（全局唯一）

### 2.1 推荐格式

`<subject缩写>.<domain>.<name>.<variant>`

示例：

- `phy.apparatus.bulb.basic`
- `phy.weight.mass.basic`
- `phy.weight.hook.realistic`
- `phy.resistor.axial.basic`
- `phy.meter.voltage.draggable`

### 2.2 规则

- 只能包含小写字母、数字、点号（`.`）与短横线（`-`）
- 必须全局唯一（CI 会校验）
- 必须与组件根节点 `data-cmp-id` 一致（CI 会校验）

---

## 3. variant（变体约定）

同一“物品/器材”可能有不同风格或交互版本，统一用 variant 表达：

- 视觉：`basic` / `flat` / `outline` / `realistic`
- 交互：`draggable` / `rotatable` / `interactive`
- 尺寸：不建议作为 variant（尺寸应走 `--cmp-size`）

---

## 4. tags（维度标签，多选）

### 4.1 最低要求

每个组件建议至少 2 个 tag：

- 一个“名词/对象”tag（如 `resistor` / `bulb`）
- 一个“领域/场景”tag（如 `circuit` / `apparatus`）

### 4.2 推荐的标签维度

- 功能类：`meter` / `sensor` / `switch` / `connector`
- 交互类：`static` / `draggable` / `rotatable`
- 风格类：`outline` / `flat` / `realistic`
- 教学类：`primary` / `junior` / `senior`（或自定义学段）
- 属性类：`voltage` / `mass` / `resistance`

> category 决定“放哪儿”，tags 决定“怎么搜/怎么筛”。

---

## 5. 文件命名（建议）

文件名建议与 id 保持强关联，便于定位：

- `components/physics/circuit/phy.resistor.axial.basic.html`
- `components/physics/apparatus/phy.apparatus.bulb.basic.html`
