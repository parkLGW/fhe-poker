# Vercel 部署检查清单 ✅

## 📋 部署前准备

### 1. 清理项目文件

- [x] 删除前端测试文件（已完成）
  - debug-relayer.html
  - simple-test.html
  - test-*.html
  - test-*.js
  
- [ ] 可选：归档开发文档
  ```bash
  cd fhe-poker
  chmod +x CLEANUP_DOCS.sh
  ./CLEANUP_DOCS.sh
  ```

### 2. 检查配置文件

- [x] `vercel.json` 已配置
- [x] `.gitignore` 已配置
- [x] `package.json` 依赖完整
- [x] `vite.config.ts` 配置正确

### 3. 本地测试

```bash
cd fhe-poker/frontend

# 安装依赖
npm install

# 本地开发测试
npm run dev

# 构建测试
npm run build

# 预览构建结果
npm run preview
```

## 🚀 部署步骤

### 方法一：通过 Vercel 网站（推荐）

#### Step 1: 推送到 GitHub

```bash
cd /Users/liuguanwei/myprojects/zama

# 查看状态
git status

# 添加所有更改
git add .

# 提交
git commit -m "Prepare for Vercel deployment"

# 推送（如果还没有远程仓库，先在 GitHub 创建）
git push origin main
```

#### Step 2: 在 Vercel 导入项目

1. 访问 https://vercel.com
2. 点击 "Sign Up" 或 "Log In"
3. 选择 "Continue with GitHub"
4. 授权 Vercel 访问你的仓库

#### Step 3: 配置项目

1. 点击 "Add New..." → "Project"
2. 选择你的 GitHub 仓库
3. 点击 "Import"

**重要配置：**
```
Framework Preset: Vite
Root Directory: fhe-poker/frontend  ⚠️ 必须设置！
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### Step 4: 部署

1. 点击 "Deploy" 按钮
2. 等待 1-2 分钟
3. 部署成功！🎉

### 方法二：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 进入前端目录
cd fhe-poker/frontend

# 登录 Vercel
vercel login

# 首次部署（会引导你配置）
vercel

# 部署到生产环境
vercel --prod
```

## ✅ 部署后检查

### 1. 功能测试

- [ ] 页面能正常加载
- [ ] 钱包连接功能正常
- [ ] 游戏界面显示正常
- [ ] 多语言切换正常
- [ ] 响应式布局正常

### 2. 性能检查

- [ ] 首屏加载时间 < 3秒
- [ ] 资源正确压缩
- [ ] 图片正确加载

### 3. 浏览器兼容性

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## 🔧 常见问题解决

### 问题 1: 构建失败

**症状**: Vercel 构建过程中报错

**解决方案**:
1. 检查本地是否能成功构建：`npm run build`
2. 查看 Vercel 构建日志中的具体错误
3. 确认 Node.js 版本兼容（Vercel 使用 Node 18+）

### 问题 2: 页面 404

**症状**: 访问子路由时出现 404

**解决方案**:
- 确认 `vercel.json` 中有 rewrites 配置（已配置）

### 问题 3: 环境变量缺失

**症状**: 应用运行时缺少配置

**解决方案**:
1. 在 Vercel 项目设置中添加环境变量
2. Settings → Environment Variables
3. 添加需要的变量（如 API keys）

### 问题 4: CORS 错误

**症状**: API 请求被 CORS 阻止

**解决方案**:
- Vercel 不支持开发环境的代理配置
- 需要后端 API 配置 CORS
- 或使用 Vercel Serverless Functions 作为代理

## 📊 Vercel 免费版限制

- ✅ 每月 100GB 带宽
- ✅ 每月 100GB-hours Serverless 执行时间
- ✅ 无限部署次数
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ⚠️ 构建时间限制 45 分钟
- ⚠️ Serverless Function 执行时间 10 秒

## 🎯 优化建议

### 1. 性能优化

```typescript
// vite.config.ts 中已配置
{
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wagmi: ['wagmi', 'viem'],
        }
      }
    }
  }
}
```

### 2. 缓存优化

Vercel 自动处理静态资源缓存，无需额外配置。

### 3. 图片优化

考虑使用 Vercel Image Optimization（需要升级到 Pro）

## 🔄 持续部署

配置完成后，每次推送到 GitHub：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel 会自动：
1. 检测到代码变更
2. 触发新的构建
3. 部署新版本
4. 发送通知

## 📱 预览部署

创建 Pull Request 时，Vercel 会自动创建预览部署：
- 每个 PR 都有独立的预览 URL
- 可以在合并前测试更改
- 预览部署不影响生产环境

## 🌐 自定义域名（可选）

1. 在 Vercel 项目中：Settings → Domains
2. 添加你的域名
3. 配置 DNS 记录：
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. 等待 DNS 生效（几分钟到几小时）

## 📚 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [前端快速部署指南](./frontend/QUICK_DEPLOY.md)
- [详细部署指南](./frontend/VERCEL_DEPLOYMENT_GUIDE.md)

## 🎉 完成！

部署成功后，你的应用将在以下 URL 可访问：
```
https://your-project-name.vercel.app
```

享受你的 FHE Poker 应用吧！🃏

