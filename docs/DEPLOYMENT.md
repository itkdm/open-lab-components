# 部署指南 (Deployment Guide)

## GitHub Pages 部署

项目已配置 GitHub Actions 自动部署到 GitHub Pages，每次推送到主分支时都会自动构建并部署网站。

### 配置步骤

1. **启用 GitHub Pages**
   - 进入 GitHub 仓库
   - 点击 Settings（设置）
   - 在左侧菜单找到 Pages
   - 在 "Source" 部分，选择 **"GitHub Actions"**
   - 保存设置

2. **首次部署**
   - 推送到 `main` 或 `master` 分支
   - GitHub Actions 会自动运行 CI/CD 流程
   - 在仓库的 **Actions** 标签页查看部署进度

3. **访问网站**
   - 部署成功后，网站可通过以下 URL 访问：
     ```
     https://itkdm.github.io/open-lab-components
     ```
   - 或者使用自定义域名（在 Pages 设置中配置）

### 部署流程

CI/CD 流程包含以下步骤：

1. **验证阶段** (`validate` job)
   - 验证所有组件是否符合规范
   - 在多个 Node.js 版本上测试

2. **部署阶段** (`deploy` job)
   - 仅在 `main`/`master` 分支触发
   - 构建组件注册表
   - 构建展示站
   - 自动部署到 GitHub Pages

### 故障排查

如果部署失败，请检查：

1. **Actions 日志**
   - 查看 GitHub Actions 的运行日志
   - 确认是否有构建错误

2. **Pages 设置**
   - 确认 Source 已设置为 "GitHub Actions"
   - 检查是否有权限问题

3. **分支名称**
   - 确认主分支名称为 `main` 或 `master`
   - 如果使用其他名称，需要更新 `.github/workflows/ci.yml`

### 本地预览构建结果

在部署前，可以在本地预览构建结果：

```bash
# 构建项目
npm run build

# 查看构建输出
ls site/dist/
```

构建后的文件位于 `site/dist/` 目录，这就是会被部署到 GitHub Pages 的内容。

