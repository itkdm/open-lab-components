# 快速开始：新增组件流程

## 📝 新增组件后的标准流程

每次新增或修改组件后，请按以下步骤操作：

### 1️⃣ 验证组件

```bash
npm run validate
```

**作用：** 检查组件是否符合规范（Manifest、DOM 契约、CSS 隔离等）

**必须通过才能继续！** 如果验证失败，请根据错误信息修复组件。

### 2️⃣ 构建注册表

```bash
npm run build:registry
```

**作用：** 
- 从所有组件文件中提取 Manifest 信息
- 生成 `registry/registry.json`（组件列表）
- 生成 `registry/categories.json`（分类信息）
- 生成 `registry/tags.json`（标签统计）

**重要：** 每次新增组件后都必须运行此命令，否则新组件不会出现在注册表中。

### 3️⃣ 构建展示站（可选）

```bash
npm run build
```

**作用：** 构建注册表 + 展示站（包含组件列表、文档等）

**或者分别运行：**
```bash
npm run build:registry  # 构建注册表
npm run build:site      # 构建展示站
```

### 4️⃣ 本地预览（可选）

```bash
npm run dev:site
```

**作用：** 启动本地开发服务器，在浏览器中预览组件展示站

访问 `http://localhost:3000` 查看效果。

---

## 🎯 完整工作流示例

假设你新增了一个组件 `phy.apparatus.spring.basic.html`：

```bash
# 1. 创建组件文件（在 components/physics/apparatus/ 目录下）
# ... 编写组件代码 ...

# 2. 验证组件
npm run validate

# 3. 构建注册表（注册新组件）
npm run build:registry

# 4. 查看注册表确认新组件已添加
cat registry/registry.json | grep "phy.apparatus.spring.basic"

# 5. 本地预览（可选）
npm run dev:site

# 6. 提交代码
git add components/physics/apparatus/phy.apparatus.spring.basic.html
git add registry/*.json  # 注册表文件
git commit -m "Add spring component"
git push
```

---

## ⚠️ 常见问题

### Q: 忘记运行 `build:registry` 会怎样？

A: 新组件不会出现在注册表中，展示站也不会显示新组件。但组件文件本身是有效的，可以直接使用。

### Q: 注册表文件可以手动编辑吗？

A: **不可以！** `registry/*.json` 文件是自动生成的，手动编辑会在下次构建时被覆盖。如果需要修改，请修改组件文件中的 Manifest。

### Q: 每次都要运行所有命令吗？

A: 
- **必须运行：** `npm run validate` 和 `npm run build:registry`
- **可选运行：** `npm run build:site`（如果不需要预览展示站可以跳过）
- **开发时：** 可以使用 `npm run dev:site` 实时预览

### Q: CI/CD 会自动构建吗？

A: 是的，GitHub Actions 会在每次推送时自动运行 `npm run build`，包括验证和构建注册表。但建议在本地先验证通过再推送。

---

## 📚 相关文档

- [组件规范](./docs/SPEC.md) - 详细的组件开发规范
- [贡献指南](./docs/CONTRIBUTING.md) - 完整的贡献流程
- [分类规则](./docs/CATEGORY.md) - 组件分类和命名规则

## Root repository checks

Run the consolidated root quality gate before commit:

```bash
npm run check:root
```

This covers the shared docs, text, script, root API, runtime harness, and
component validation boundaries in one pass.
