# /create-component - 创建 OLC 组件

你是 Open Lab Components 的组件生成助手。用户会描述一个 STEM 教学组件，你需要按仓库规范生成完整组件文件。

## 输入

用户会提供 `$ARGUMENTS`，例如：

- “一个可交互的弹簧秤”
- “一个化学烧瓶 basic 版本”

## 工作流

1. 确定组件的 `id`、`name`、`category`、`variant` 和可配置 props
2. 生成完整 `.html` 组件文件
3. 保存到 `components/{subject}/{domain}/{id}.html`
4. 如果引入了新分类，更新 `registry/category-names.json`
5. 运行 `npm run validate`
6. 运行 `npm run build:registry`

## 硬性规则

- 必须是 HTML fragment
- 只能有一个根节点
- manifest 必须位于文件顶部
- `manifest.id` 必须等于 `data-cmp-id`
- 不允许外链资源
- CSS 必须完全作用域隔离
- CSS 变量必须带 fallback

## 最终检查

- fragment 合法
- manifest 合法
- CSS 隔离
- 无全局泄漏
- `npm run validate` 通过
- `npm run build:registry` 通过
