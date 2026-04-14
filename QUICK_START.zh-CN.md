# 快速开始：新增组件流程

## 推荐工作流

每次新增或修改组件后，建议按下面的顺序执行：

### 1. 验证组件

```bash
npm run validate
```

这一步会检查 manifest、DOM 契约、CSS 隔离和其他组件规范。

### 2. 重建 registry

```bash
npm run build:registry
```

这一步会从组件文件提取 manifest 元数据，并重新生成：

- `registry/registry.json`
- `registry/categories.json`
- `registry/tags.json`

如果跳过这一步，新组件不会出现在生成后的 registry 中。

### 3. 按需重建站点

```bash
npm run build
```

也可以拆开执行：

```bash
npm run build:registry
npm run build:site
```

### 4. 按需本地预览

```bash
npm run dev:site
```

然后访问 `http://localhost:3000`。

## 示例流程

假设你新增了 `phy.apparatus.spring.basic.html`：

```bash
npm run validate
npm run build:registry
npm run dev:site

git add components/physics/apparatus/phy.apparatus.spring.basic.html
git add registry/*.json
git commit -m "Add spring component"
git push
```

## 常见问题

### 忘记执行 `build:registry` 会怎样

组件文件本身仍然有效，但它不会进入生成后的 registry 和站点输出。

### 可以手工编辑 `registry/*.json` 吗

不可以。这些文件是生成产物，下次构建时会被覆盖。

### 每次都要执行全部命令吗

- 必需：`npm run validate`、`npm run build:registry`
- 可选：`npm run build:site`、`npm run dev:site`

### CI 会自动构建吗

会。GitHub Actions 会在推送时执行构建流程，但仍建议先在本地完成校验。

## 相关文档

- [组件规范](./docs/SPEC.zh-CN.md)
- [贡献指南](./docs/CONTRIBUTING.zh-CN.md)
- [分类规则](./docs/CATEGORY.zh-CN.md)

## 根仓库检查

提交前建议执行：

```bash
npm run check:root
```

这会一次性覆盖 docs、text、scripts、root API、runtime harness 和组件校验边界。
