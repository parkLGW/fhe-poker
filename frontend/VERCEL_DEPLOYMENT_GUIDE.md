# Vercel 部署指南

本指南将帮助你将 FHE Poker 前端项目部署到 Vercel 免费服务上。

## 前置要求

1. GitHub 账号
2. Vercel 账号（可以使用 GitHub 账号登录）
3. 项目代码已推送到 GitHub 仓库

## 部署步骤

### 1. 准备 GitHub 仓库

如果你还没有将代码推送到 GitHub：

```bash
# 在项目根目录下
cd /Users/liuguanwei/myprojects/zama

# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit for Vercel deployment"

# 创建 GitHub 仓库后，添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送代码
git push -u origin main
```

### 2. 登录 Vercel

1. 访问 [https://vercel.com](https://vercel.com)
2. 点击 "Sign Up" 或 "Log In"
3. 选择 "Continue with GitHub" 使用 GitHub 账号登录
4. 授权 Vercel 访问你的 GitHub 仓库

### 3. 导入项目

1. 登录后，点击 "Add New..." → "Project"
2. 在 "Import Git Repository" 页面，找到你的仓库
3. 如果看不到仓库，点击 "Adjust GitHub App Permissions" 授权更多仓库
4. 点击你的仓库旁边的 "Import" 按钮

### 4. 配置项目

在项目配置页面：

**Framework Preset**: 选择 "Vite"

**Root Directory**: 点击 "Edit"，输入 `fhe-poker/frontend`

**Build and Output Settings**:
- Build Command: `npm run build` (已自动检测)
- Output Directory: `dist` (已自动检测)
- Install Command: `npm install` (已自动检测)

**Environment Variables** (如果需要):
- 暂时不需要添加环境变量

### 5. 部署

1. 检查所有配置无误后，点击 "Deploy" 按钮
2. Vercel 会开始构建和部署你的项目
3. 等待几分钟，部署完成后会显示成功页面
4. 你会得到一个类似 `https://your-project.vercel.app` 的 URL

### 6. 访问你的应用

部署成功后：
1. 点击 "Visit" 按钮或访问提供的 URL
2. 你的 FHE Poker 应用现在已经在线了！

## 配置说明

项目已经包含了 `vercel.json` 配置文件，包含以下设置：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

这个配置确保：
- 使用 Vite 框架
- 正确的构建命令和输出目录
- SPA 路由重写（所有路由都指向 index.html）

## 自动部署

配置完成后，每次你推送代码到 GitHub 的 main 分支：
1. Vercel 会自动检测到更改
2. 自动构建和部署新版本
3. 部署完成后会收到通知

## 自定义域名（可选）

如果你有自己的域名：

1. 在 Vercel 项目页面，点击 "Settings" → "Domains"
2. 输入你的域名
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

## 常见问题

### 1. 构建失败

如果构建失败，检查：
- `package.json` 中的依赖是否正确
- Node.js 版本是否兼容（Vercel 默认使用最新 LTS 版本）
- 构建日志中的错误信息

### 2. 页面空白

如果部署后页面空白：
- 检查浏览器控制台的错误信息
- 确认 `vite.config.ts` 配置正确
- 检查是否有环境变量缺失

### 3. 路由 404 错误

如果刷新页面出现 404：
- 确认 `vercel.json` 中的 rewrites 配置存在
- 这个配置已经包含在项目中，应该不会有问题

### 4. CORS 错误

如果遇到 CORS 错误：
- 这是因为 Vercel 不支持开发环境的代理配置
- 你可能需要配置 Vercel Serverless Functions 来代理 API 请求
- 或者直接使用后端 API 的 CORS 配置

## 性能优化建议

1. **启用 Gzip 压缩**: Vercel 默认启用
2. **CDN 加速**: Vercel 自动使用全球 CDN
3. **图片优化**: 考虑使用 Vercel 的图片优化功能
4. **代码分割**: Vite 已经自动处理

## 监控和分析

Vercel 免费版提供：
- 部署历史记录
- 基本的访问分析
- 构建日志
- 实时日志（有限）

访问项目的 "Analytics" 标签查看详细信息。

## 下一步

部署成功后，你可以：
1. 配置自定义域名
2. 设置环境变量
3. 配置 Serverless Functions（如果需要后端 API）
4. 启用预览部署（Pull Request 自动部署）
5. 配置团队协作

## 资源链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Vercel CLI](https://vercel.com/docs/cli)

## 使用 Vercel CLI 部署（替代方案）

如果你更喜欢使用命令行：

```bash
# 安装 Vercel CLI
npm install -g vercel

# 在 frontend 目录下
cd fhe-poker/frontend

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

## 注意事项

1. **免费版限制**:
   - 每月 100GB 带宽
   - 每月 100GB-hours 的 Serverless Function 执行时间
   - 无限的部署次数
   - 对于个人项目完全够用

2. **构建时间**:
   - 免费版有 45 分钟的构建时间限制
   - 你的项目构建通常只需要 1-2 分钟

3. **环境变量**:
   - 如果项目需要环境变量，在 Vercel 项目设置中添加
   - 不要在代码中硬编码敏感信息

祝你部署顺利！🚀

