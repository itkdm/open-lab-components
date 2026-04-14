# GitHub Pages 详细操作步骤

## ✅ 第一步：确认 Pages 设置（已完成）

从你的截图可以看到：
- ✅ Source 已选择为 **"GitHub Actions"**
- ✅ 显示 "GitHub Pages source saved." 表示配置已保存

## 📋 第二步：检查 GitHub Actions 工作流

### 2.1 查看 Actions 标签页

1. 在仓库页面，点击顶部的 **"Actions"** 标签
2. 你应该能看到一个工作流运行，名称是 **"CI"**
3. 点击这个工作流运行，查看详细进度

### 2.2 工作流执行步骤

工作流会按顺序执行：

1. **validate** 任务（验证组件）
   - 在 Node.js 18.x 和 20.x 上运行
   - 验证所有组件是否符合规范

2. **deploy** 任务（部署到 Pages）
   - 仅在 `main` 分支触发
   - 构建组件注册表
   - 构建展示站
   - 部署到 GitHub Pages

### 2.3 查看部署状态

- 🟡 **黄色圆点** = 正在运行
- ✅ **绿色对勾** = 成功完成
- ❌ **红色叉号** = 失败（点击查看错误信息）

## 🌐 第三步：访问你的网站

### 3.1 等待部署完成

- 首次部署通常需要 **2-5 分钟**
- 在 Actions 页面可以看到实时进度

### 3.2 访问网站

部署成功后，你的网站可以通过以下 URL 访问：

```
https://itkdm.github.io/open-lab-components
```

### 3.3 查看网站 URL

你也可以在 Pages 设置页面查看：
1. 回到 **Settings → Pages**
2. 在页面顶部会显示你的网站 URL
3. 点击 URL 可以直接访问

## 🔄 第四步：后续更新

### 4.1 更新代码后自动部署

每次你推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 验证组件
2. 构建网站
3. 部署到 GitHub Pages

**无需手动操作！**

### 4.2 推送代码命令

```bash
# 1. 修改代码后，添加更改
git add .

# 2. 提交更改
git commit -m "更新描述"

# 3. 推送到 GitHub（会自动触发部署）
git push origin main

# 4. 如果需要，也推送到 Gitee
git push gitee main
```

## 🐛 故障排查

### 问题 1：工作流没有运行

**可能原因：**
- 代码还没有推送到 `main` 分支
- GitHub Actions 被禁用

**解决方法：**
1. 确认代码已推送到 `main` 分支
2. 检查 Settings → Actions → General，确保 Actions 已启用

### 问题 2：部署失败

**可能原因：**
- 构建脚本出错
- 组件验证失败

**解决方法：**
1. 在 Actions 页面点击失败的工作流
2. 查看错误日志，找到具体错误信息
3. 根据错误信息修复问题
4. 重新推送代码

### 问题 3：网站显示 404

**可能原因：**
- 部署还在进行中
- 部署失败

**解决方法：**
1. 等待几分钟后刷新
2. 检查 Actions 页面确认部署状态
3. 确认 URL 是否正确：`https://itkdm.github.io/open-lab-components`

### 问题 4：网站内容没有更新

**可能原因：**
- 浏览器缓存
- 部署还在进行中

**解决方法：**
1. 强制刷新页面（Ctrl+F5 或 Cmd+Shift+R）
2. 等待部署完成（查看 Actions 页面）
3. GitHub Pages 更新可能需要几分钟才能生效

## 📝 检查清单

完成以下检查清单，确保一切正常：

- [ ] GitHub Pages Source 设置为 "GitHub Actions" ✅（已完成）
- [ ] 代码已推送到 `main` 分支 ✅（已完成）
- [ ] Actions 工作流正在运行或已完成
- [ ] 部署任务（deploy job）成功完成
- [ ] 可以通过 `https://itkdm.github.io/open-lab-components` 访问网站
- [ ] 网站内容显示正常

## 🎉 完成！

一旦部署成功，你的组件展示站就可以公网访问了！

**网站功能：**
- 📦 浏览所有组件
- 🎨 实时预览和调整参数
- 📋 复制组件代码
- 📚 查看组件文档

---

**需要帮助？**
- 查看 Actions 日志了解详细错误
- 检查 `docs/DEPLOYMENT.md` 了解更多部署信息
- 查看 `docs/SPEC.md` 了解组件规范

