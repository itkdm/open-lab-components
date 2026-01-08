# 贡献指南（CONTRIBUTING）

欢迎提交新组件、修复问题与改进文档。为保证仓库长期可维护，请严格遵守 `docs/SPEC.md` 与 `docs/CATEGORY.md`。

---

## 1. 你需要准备什么

- 了解：组件必须是 **HTML fragment**，且参数通过 **CSS 变量**对外暴露。
- 建议：在提交前本地跑校验脚本（若仓库提供 `tools/validate` / `npm test` / `pnpm test`）。

---

## 2. 新增组件（推荐流程）

### Step 1：复制模板

- 从仓库提供的模板（或任意一个最接近的组件）复制一份作为起点。
- 将文件放入正确目录（与 `category` 对齐）。

### Step 2：填写 Manifest

在文件顶部填写 `@cmp-manifest`，至少包含：

- `schema / id / name / category / version`
- 推荐补充：`viewport / tags / props / cssVars`

并确保：

- `manifest.id` 与根节点 `data-cmp-id` 完全一致
- `id` 全局唯一

### Step 3：实现组件本体

- 组件根节点：`class="cmp"` + `role="img"` + `aria-label`
- 样式必须作用域隔离（以根节点前缀限定）
- 关键配置必须通过 CSS 变量读取：`var(--cmp-xxx, fallback)`

### Step 4：本地自检

请对照 `docs/SPEC.md` 的"质量检查清单"逐条自检：

- HTML fragment / 单根节点 / 无外链 / CSS 隔离 / CSS 变量 / JS 自包含（如有）

### Step 5：验证和注册组件

**重要：每次新增组件后，必须执行以下命令更新注册表：**

```bash
# 1. 验证组件是否符合规范
npm run validate

# 2. 构建注册表（将新组件注册到 registry/）
npm run build:registry

# 3. 如果需要更新展示站，运行完整构建
npm run build
```

**说明：**
- `npm run validate` - 验证所有组件是否符合规范（必须通过）
- `npm run build:registry` - 从组件文件中提取 Manifest，生成 `registry/registry.json`、`registry/categories.json`、`registry/tags.json`
- `npm run build` - 构建注册表和展示站（包含 `build:registry` 和 `build:site`）

**注意：** 注册表文件（`registry/*.json`）是自动生成的，不要手动编辑。每次新增或修改组件后都需要重新运行 `npm run build:registry`。

### Step 6：提交 PR

PR 描述中请包含：

- 组件用途与所属分类
- 预览截图或 GIF（可放在 PR 中；**组件文件本体禁止外链**）
- 若是交互组件，说明交互方式与边界

---

## 3. 修改已有组件

- 修复 bug：建议 `version` 做 patch（如 `1.0.1`）
- 新增可配置项：建议 minor（如 `1.1.0`）
- 不兼容变更：必须 major（如 `2.0.0`）并写迁移说明

---

## 4. 评审关注点（Reviewer Checklist）

- 是否违反“禁止外链/禁止全局污染”
- id / category / tags 是否符合规则
- props / cssVars 是否描述清晰、默认值合理
- 组件是否足够“纯粹”（不掺杂页面背景、说明文案、布局容器等）
- 若有 JS：是否自包含、是否可被宿主安全复用

---

## 5. 贡献即同意授权

除非仓库另有说明，你提交的代码与资源将按仓库 `LICENSE` 授权给项目使用与再分发。
