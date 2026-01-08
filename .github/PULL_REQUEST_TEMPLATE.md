## 变更说明

请简要描述你做了什么、为什么做。

---

## 类型（选填）

- [ ] 新增组件
- [ ] 修复组件
- [ ] 改进文档/工具
- [ ] 其他

---

## 预览（建议）

请贴截图 / GIF（可直接粘贴到 PR）。

---

## 自检清单（必须全部勾选）

- [ ] 组件是 HTML fragment（无 doctype/html/head/body）
- [ ] 文件内只有一个根节点（组件根容器）
- [ ] 根节点包含：class="cmp"、data-cmp-id、role="img"、aria-label
- [ ] 文件顶部存在 @cmp-manifest，且 JSON 可解析
- [ ] Manifest.id 与 data-cmp-id 完全一致，且 id 全局唯一
- [ ] 无外链资源（无 http/https/@import 等）
- [ ] CSS 已作用域隔离（无 html/body/:root/* 全局污染）
- [ ] 关键可配置项通过 CSS 变量暴露，且提供 fallback
- [ ] 若包含 JS：IIFE 自包含、无全局污染、无网络请求、仅操作自身 DOM

---

## 关联 Issue（选填）

Closes #
