# Git 初始化命令

## 完整命令序列

在项目根目录（`open-lab-components`）执行以下命令：

### 1. 初始化 Git 仓库
```bash
git init
```

### 2. 添加所有文件（.gitignore 会自动排除不需要的文件）
```bash
git add .
```

### 3. 创建初始提交
```bash
git commit -m "Initial commit: Open Lab Components v0.1.0"
```

### 4. 添加远程仓库
```bash
# 添加 GitHub 远程仓库
git remote add origin git@github.com:itkdm/open-lab-components.git

# 添加 Gitee 远程仓库（可选）
git remote add gitee git@gitee.com:itkdm/open-lab-components.git
```

### 5. 设置默认分支为 main（如果还没有）
```bash
git branch -M main
```

### 6. 推送到远程仓库
```bash
# 推送到 GitHub
git push -u origin main

# 推送到 Gitee（如果添加了）
git push -u gitee main
```

## 一键执行脚本（PowerShell）

如果使用 PowerShell，可以复制以下命令一次性执行：

```powershell
git init
git add .
git commit -m "Initial commit: Open Lab Components v0.1.0"
git branch -M main
git remote add origin git@github.com:itkdm/open-lab-components.git
git remote add gitee git@gitee.com:itkdm/open-lab-components.git
git push -u origin main
git push -u gitee main
```

## 注意事项

1. **SSH 密钥**：确保已配置 GitHub 和 Gitee 的 SSH 密钥
   - GitHub: https://github.com/settings/keys
   - Gitee: https://gitee.com/profile/sshkeys

2. **如果使用 HTTPS**（需要输入用户名密码）：
   ```bash
   git remote add origin https://github.com/itkdm/open-lab-components.git
   git remote add gitee https://gitee.com/itkdm/open-lab-components.git
   ```

3. **首次推送可能需要认证**，按照提示操作即可

4. **后续更新**：
   ```bash
   git add .
   git commit -m "你的提交信息"
   git push origin main
   git push gitee main  # 如果使用双仓库
   ```

