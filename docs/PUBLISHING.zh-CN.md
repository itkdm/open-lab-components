# 发布指南

这个仓库当前包含两个可发布的 npm 包：

- 根包：`@itkdm/open-lab-components`
- MCP 包：`@itkdm/open-lab-components-mcp`

## 推荐流程

1. 先跑根仓库质量路径：

```bash
npm run check:root
```

2. 再跑发布冒烟检查：

```bash
npm run check:release
```

3. 然后跑更完整的发布前检查：

```bash
npm run release:ready
```

它会展开为：

- `npm run release:check`
- `npm run release:pack`

当前 `npm run release:check` 会执行：

- `npm run validate`
- `npm run build:registry`
- `npm run mcp:test`
- `npm run build:site`

当前 `prepublishOnly` 只保留较窄的发布钩子：

- `npm run build:registry`
- `npm run check:registry`

## 已发布文件边界

根包会发布这些文件：

- `index.js`
- `index.d.ts`
- `lib/**/*.js`
- `components/**/*.html`
- `registry/*.json`
- `visuals/**/*`

MCP 包会发布这些文件：

- `src/**/*`
- `config/**/*.json`
- `deploy/**/*`
- `.env.example`
- `README.md`
- `DEPLOYMENT.md`
- `DEPLOYMENT-CHECKLIST.md`
- `OPERATIONS.md`

## 发布前人工复核

发布前请检查：

- `CHANGELOG.md`
- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`
- `docs/RELEASE-CHECKLIST-0.2.0.md`
- `docs/RELEASE-COMMANDS-0.2.0.md`

## 推荐发布步骤

1. 提交本次 release 改动
2. 创建 tag：

```bash
git tag v0.2.0
```

3. 发布根包：

```bash
npm publish
```

4. 发布 MCP 包：

```bash
npm --prefix mcp-server publish
```

5. 推送分支和 tag：

```bash
git push origin <branch>
git push origin v0.2.0
```

6. 按以下文档创建 GitHub Release：

- `docs/GITHUB-RELEASE-0.2.0.md`
- `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`

## 共享工作流顺序

发布流程应保持这个顺序：

1. `npm run check:root`
2. `npm run check:release`
3. `npm run release:ready`
4. `git diff -- package.json mcp-server/package.json README.en.md README.md docs site/index.html`
5. `git commit -m "release: prepare v0.2.0 locale-aware metadata rollout"`
6. `git tag v0.2.0`
7. `npm publish`
8. `npm --prefix mcp-server publish`
9. `git push origin <branch>`
10. `git push origin v0.2.0`
11. `docs/GITHUB-RELEASE-0.2.0.md`
12. `docs/ANNOUNCEMENT-0.2.0.zh-CN.md`

## 说明

- `release:check` 用来校验仓库并重建发布产物
- `release:pack` 用来验证两个 npm 包当前都能正确打包
- `release:ready` 会顺序执行这两步
- `npm run pack:check` 是根包的 dry-run 打包入口
- `npm run mcp:pack:check` 是 MCP 包的 dry-run 打包入口
- `npm run check:root` 用于在进入发布流程前先验证根仓库质量边界
- `npm run check:release` 用于确认两个可发布包的关键 tarball 内容没有漂移
- `prepublishOnly` 刻意保持为较窄的钩子，只负责 registry 生成与校验
- `docs/` 中带版本号的发布文档应与当前包版本和 release tag 保持一致
