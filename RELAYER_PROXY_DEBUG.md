# Relayer 代理调试指南

## 问题分析

**错误信息**:
```
GET https://relayer.testnet.zama.cloud/v1/keyurl net::ERR_FAILED 403 (Forbidden)
CORS policy: No 'Access-Control-Allow-Origin' header
```

**根本原因**:
- Relayer 服务返回 403 错误
- 浏览器 CORS 策略阻止了跨域请求
- relayer-sdk 从 CDN 加载，直接向 Relayer 发起请求

---

## 修复方案

### 1. Vite 代理配置

**文件**: `frontend/vite.config.ts`

```typescript
server: {
  proxy: {
    '/v1': {
      target: 'https://relayer.testnet.zama.cloud',
      changeOrigin: true,
      rewrite: (path) => path,
    },
  },
}
```

**工作原理**:
- 浏览器请求 `http://localhost:5173/v1/keyurl`
- Vite 代理转发到 `https://relayer.testnet.zama.cloud/v1/keyurl`
- 绕过 CORS 限制

### 2. FHEVM 配置更新

**文件**: `frontend/src/lib/fhevm.ts`

```typescript
const config = { 
  ...SepoliaConfig, 
  network: window.ethereum,
  relayerUrl: 'http://localhost:5173/v1',  // 使用本地代理 URL
};
```

---

## 测试步骤

### 步骤 1: 验证 Vite 代理

打开浏览器开发者工具 (F12)，在控制台中运行:

```javascript
// 测试代理是否工作
fetch('http://localhost:5173/v1/keyurl')
  .then(r => r.json())
  .then(d => console.log('✅ 代理工作:', d))
  .catch(e => console.log('❌ 代理失败:', e.message))
```

**预期结果**:
- ✅ 如果看到 JSON 数据，说明代理工作正常
- ❌ 如果看到错误，说明代理配置有问题

### 步骤 2: 刷新页面

按 **Ctrl+F5** (强制刷新，清除缓存)

### 步骤 3: 查看控制台日志

打开浏览器开发者工具 (F12)，查看 Console 标签

**成功日志**:
```
✅ SDK 初始化完成
✅ FHEVM 实例创建成功
✅ FHEVM initialized for chain: 11155111
```

**失败日志**:
```
❌ FHEVM初始化失败: Error: Relayer didn't respond correctly. Bad JSON.
```

---

## 故障排查

### 问题 1: 仍然看到 CORS 错误

**检查清单**:
- [ ] Vite 配置是否已保存
- [ ] 前端服务器是否已重启
- [ ] 浏览器是否进行了强制刷新 (Ctrl+F5)
- [ ] 浏览器缓存是否已清除

**解决步骤**:
1. 完全关闭前端服务器 (Ctrl+C)
2. 清除浏览器缓存 (Ctrl+Shift+Delete)
3. 重新启动前端: `npm run dev`
4. 强制刷新浏览器: Ctrl+F5

### 问题 2: 代理返回 404

**原因**: Relayer 服务可能不可用

**检查**:
```javascript
// 在浏览器控制台中运行
fetch('http://localhost:5173/v1/keyurl')
  .then(r => {
    console.log('状态码:', r.status);
    return r.text();
  })
  .then(t => console.log('响应:', t))
  .catch(e => console.log('错误:', e))
```

**可能的原因**:
- Relayer 服务暂时不可用
- 网络连接问题
- Relayer URL 已更改

### 问题 3: "crossOriginIsolated = false"

**原因**: 浏览器没有正确设置 COOP/COEP 头

**检查**:
```javascript
// 在浏览器控制台中运行
console.log('crossOriginIsolated:', crossOriginIsolated);
```

**解决**:
- 确保 Vite 配置中有 COOP/COEP 头
- 使用最新版本的浏览器
- 尝试隐私模式

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
      '/v1': {
        target: 'https://relayer.testnet.zama.cloud',
        changeOrigin: true,
        rewrite: (path) => path,
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

## 网络请求流程

```
浏览器
  ↓
请求: http://localhost:5173/v1/keyurl
  ↓
Vite 代理
  ↓
转发到: https://relayer.testnet.zama.cloud/v1/keyurl
  ↓
Relayer 服务
  ↓
返回响应
  ↓
Vite 代理
  ↓
返回给浏览器
  ↓
✅ 成功 (绕过 CORS)
```

---

## 相关文件

- `frontend/vite.config.ts` - Vite 配置
- `frontend/src/lib/fhevm.ts` - FHEVM 初始化
- `frontend/test-relayer-proxy.js` - 代理测试脚本

---

## 下一步

1. 刷新浏览器页面 (Ctrl+F5)
2. 查看浏览器控制台日志
3. 如果仍有问题，参考故障排查部分
4. 按照 [TESTING_GUIDE.md](./TESTING_GUIDE.md) 进行测试

---

**修复状态**: ✅ **已应用**
**测试状态**: 📋 **待测试**

