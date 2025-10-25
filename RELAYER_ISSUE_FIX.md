# Relayer 连接问题修复

## 问题描述

前端启动时出现以下错误：
```
FHEVM初始化失败: Error: Relayer didn't respond correctly. Bad JSON.
CORS policy: No 'Access-Control-Allow-Origin' header
GET https://relayer.testnet.zama.cloud/v1/keyurl net::ERR_FAILED 403
```

## 根本原因

1. **CORS 问题**: Relayer 服务返回 403 错误，浏览器阻止了跨域请求
2. **网络问题**: Relayer 服务可能暂时不可用或网络连接问题
3. **配置问题**: Vite 没有配置代理来处理 Relayer 请求

## 修复方案

### 1. 添加 Vite 代理配置

**文件**: `frontend/vite.config.ts`

**修改**:
```typescript
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
  proxy: {
    '/relayer': {
      target: 'https://relayer.testnet.zama.cloud',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/relayer/, ''),
    },
  },
},
```

**效果**: 通过本地代理转发 Relayer 请求，绕过 CORS 限制

### 2. 重启前端服务器

```bash
# Vite 会自动检测配置变化并重启
# 如果没有自动重启，手动重启：
npm run dev
```

---

## 验证修复

### 检查浏览器控制台

刷新页面后，应该看到：

✅ **成功日志**:
```
🔍 浏览器兼容性检查: { ... }
🔧 按照 dev.md 文档初始化 FHEVM... { chainId: 11155111 }
🔧 开始初始化 SDK...
🔧 正在加载 WASM 模块...
✅ SDK 初始化完成
🔧 开始创建 FHEVM 实例...
✅ FHEVM 实例创建成功
✅ FHEVM initialized for chain: 11155111
```

❌ **失败日志** (需要继续排查):
```
❌ FHEVM初始化失败: Error: ...
```

---

## 故障排查

### 问题 1: 仍然出现 CORS 错误

**原因**: 代理配置未生效

**解决**:
1. 确保 `vite.config.ts` 已保存
2. 完全关闭前端服务器 (Ctrl+C)
3. 重新启动: `npm run dev`
4. 清除浏览器缓存 (Ctrl+Shift+Delete)
5. 刷新页面 (Ctrl+F5)

### 问题 2: 仍然出现 403 错误

**原因**: Relayer 服务可能暂时不可用

**解决**:
1. 检查网络连接
2. 尝试访问 https://relayer.testnet.zama.cloud/v1/keyurl
3. 等待 Relayer 服务恢复
4. 查看 Zama 官方状态页面

### 问题 3: "crossOriginIsolated = false"

**原因**: 浏览器没有正确设置 COOP/COEP 头

**解决**:
1. 确保 Vite 配置中有 COOP/COEP 头
2. 使用最新版本的浏览器
3. 尝试隐私模式
4. 清除浏览器数据

---

## 完整的 Vite 配置

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es'
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/relayer': {
        target: 'https://relayer.testnet.zama.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/relayer/, ''),
      },
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    exclude: [
      '@zama-fhe/relayer-sdk',
      'tfhe',
      'tkms',
      'node-tfhe',
      'node-tkms'
    ],
  },
})
```

---

## 测试步骤

### 1. 启动前端
```bash
cd frontend
npm run dev
```

### 2. 打开浏览器
```
http://localhost:5173/
```

### 3. 打开开发者工具
```
F12 或 Cmd+Option+I
```

### 4. 查看控制台日志
- 应该看到 FHEVM 初始化成功的日志
- 不应该看到 CORS 或 403 错误

### 5. 连接钱包
- 点击"连接钱包"
- 选择 MetaMask
- 确保连接到 Sepolia 测试网

### 6. 验证 FHEVM 初始化
- 如果看到 "✅ FHEVM initialized" 日志，说明成功
- 如果看到错误，参考故障排查部分

---

## 相关文档

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 测试指南
- [BET_FIX_README.md](./BET_FIX_README.md) - 修复使用指南
- [dev.md](../dev.md) - FHEVM 开发文档

---

## 总结

✅ **修复已应用**

Vite 代理配置已添加，应该能够解决 CORS 问题。

**下一步**:
1. 刷新浏览器页面
2. 查看控制台日志
3. 如果仍有问题，参考故障排查部分

---

**修复状态**: ✅ **完成**
**测试状态**: 📋 **待测试**

