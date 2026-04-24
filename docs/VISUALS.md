# 图片资源模块

## 模块定位

`visuals/` 是项目里静态教学图片资源的事实源目录。

它解决的是这样一类课堂场景：老师并不总是需要交互组件，有时更需要一张
能直接放进课件、讲义或课堂讲解里的知识图、流程图、结构示意图。

这个模块把这些图片资源也纳入和组件库一致的体系里：

- 统一源目录
- 统一元数据
- 统一构建产物
- 统一站点浏览入口
- 统一 MCP 检索入口

## 目录约定

每张图至少包含两部分：

- 一个元数据文件 `*.json`
- 一个实际资源文件，比如 `*.svg`

示例：

```text
visuals/
  physics/
    vis.physics.series-circuit-flow.json
    vis.physics.series-circuit-flow.svg
```

## 目前支持的元数据

- `schema`
- `id`
- `subject`
- `topic`
- `type`
- `version`
- `format`
- `asset`
- `thumbnail`
- `gradeRange`
- `relatedComponents`
- `size`
- `locales`

本地化字段包括：

- `title`
- `summary`
- `tags`

## 编写建议

1. `id` 统一使用 `vis.<subject>.*` 前缀。
2. 优先做“老师直接能讲”的图，不要先堆装饰性插图。
3. 图片本身要尽量脱离上下文也能看懂。
4. 如果能和现有组件搭配，补上 `relatedComponents`。
5. `zh-CN` 先写完整，再补 `en`。

## 构建产物

执行：

```bash
npm run build:registry
```

会生成：

- `registry/visuals.json`
- `registry/visuals.zh-CN.json`
- `registry/visuals.en.json`
- `registry/visual-subjects*.json`
- `registry/visual-tags*.json`

## 使用入口

根包 API：

```js
const lab = require("@itkdm/open-lab-components");

const list = lab.visuals.list({ subject: "physics" }, { locale: "zh-CN" });
const item = lab.visuals.get("vis.physics.series-circuit-flow");
const raw = lab.visuals.readSync("vis.physics.series-circuit-flow");
```

MCP 入口：

- `list_visuals`
- `search_visuals`
- `get_visual`
- `openlab://visuals/overview`

站点入口：

- `site/visuals.html`

## 推荐优先补的资源类型

建议优先新增这几类：

1. 知识结构图
2. 实验流程图
3. 器材或系统示意图
4. 课堂总结图

这几类最稳定，也最容易被老师重复使用。
