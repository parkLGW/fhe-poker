# 快速部署到 Vercel

## 🚀 三步部署

### 1️⃣ 推送代码到 GitHub

```bash
# 在项目根目录
cd /Users/liuguanwei/myprojects/zama

# 添加并提交更改
git add .
git commit -m "Ready for Vercel deployment"

# 推送到 GitHub（如果还没有远程仓库，先在 GitHub 创建一个）
git push origin main
```

### 2️⃣ 导入到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 选择你的 GitHub 仓库
5. 点击 "Import"

### 3️⃣ 配置并部署

在配置页面设置：

- **Framework Preset**: Vite
- **Root Directory**: `fhe-poker/frontend` ⚠️ 重要！
- **Build Command**: `npm run build` (自动检测)
- **Output Directory**: `dist` (自动检测)

点击 "Deploy" 按钮，等待 1-2 分钟即可完成！

## ✅ 完成

部署成功后，你会得到一个 URL，例如：
```
https://your-project-name.vercel.app
```

## 🔄 自动部署

之后每次推送代码到 GitHub，Vercel 会自动重新部署！

## 📚 详细文档

查看 [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) 了解更多详情。

## ⚡ 使用 CLI 部署（可选）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 在 frontend 目录下
cd fhe-poker/frontend

# 登录并部署
vercel login
vercel --prod
```

## 🎯 注意事项

1. ✅ 测试文件已清理
2. ✅ vercel.json 配置已就绪
3. ✅ .gitignore 已配置
4. ⚠️ 确保设置正确的 Root Directory: `fhe-poker/frontend`

