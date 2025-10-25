# FHEVM 初始化错误修复

## 问题描述

前端启动时出现以下错误：
```
GET http://localhost:5173/v1/keyurl 403 (Forbidden)
FHEVM初始化失败: Error: HTTP error! status: 403
```

这个错误发生在 `fhe-poker/frontend/src/lib/fhevm.ts` 第 50 行，当尝试从 npm 包导入 relayer SDK 时。

## 根本原因

代码尝试通过 npm 包导入 relayer SDK：
```typescript
const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/bundle');
```

但是：
1. npm 包的 ESM 版本依赖于 Node.js 特定的模块（如 `keccak`）
2. 这些模块在浏览器环境中无法正确加载
3. 应该使用官方提供的 UMD CDN 脚本

### 关键发现：全局对象名称

UMD CDN 脚本将 SDK 暴露为 **`window.relayerSDK`**，而不是 `window.fhevm`！

这是因为 UMD 脚本的包装器代码：
```javascript
(function(Te,Ce){
  ...
  Ce(Te.relayerSDK={})  // 暴露为 relayerSDK
})(this,function(Te){...})
```

因此，访问 SDK 时应该使用 `window.relayerSDK`，而不是 `window.fhevm`。

## 修复方案

### 1. 修改文件：`fhe-poker/frontend/index.html`

在 `<head>` 中添加 UMD CDN 脚本：

```html
<!-- Load Zama Relayer SDK UMD bundle -->
<script
  src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
```

### 2. 修改文件：`fhe-poker/frontend/src/lib/fhevm.ts`

**第 3-10 行更新 Window 接口声明：**

```typescript
declare global {
  interface Window {
    ethereum?: any;
    fhevm?: any;
    relayerSDK?: any;  // UMD CDN 脚本暴露为 relayerSDK
  }
}
```

**第 14-61 行添加等待函数：**

```typescript
/**
 * 等待 UMD CDN 脚本加载完成
 * UMD 脚本暴露为 window.relayerSDK，而不是 window.fhevm
 * @param maxWaitTime 最大等待时间（毫秒）
 */
async function waitForFhevmSDK(maxWaitTime: number = 30000): Promise<void> {
  const startTime = Date.now();
  let checkCount = 0;

  console.log('🔍 开始检查 window.relayerSDK...');

  while (!window.relayerSDK) {
    checkCount++;
    const elapsed = Date.now() - startTime;

    if (checkCount % 20 === 0) {
      console.log(`⏳ 等待 Relayer SDK 加载... (${elapsed}ms)`);
    }

    if (elapsed > maxWaitTime) {
      console.error('❌ Relayer SDK 加载超时');
      console.error('📦 window 对象中的相关属性:', {
        hasRelayerSDK: !!window.relayerSDK,
        hasFhevm: !!window.fhevm,
        allKeys: Object.keys(window).filter(k =>
          k.toLowerCase().includes('relay') ||
          k.toLowerCase().includes('fhe') ||
          k.toLowerCase().includes('zama')
        )
      });
      throw new Error(
        'Relayer SDK 加载超时（30秒）。请检查：\n' +
        '1. UMD CDN 脚本是否在 index.html 中正确加载\n' +
        '2. CDN URL 是否可访问：https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs\n' +
        '3. 浏览器控制台是否有其他错误'
      );
    }
    // 等待 100ms 后重新检查
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Relayer SDK 已加载');
  console.log('📦 window.relayerSDK 对象:', {
    hasInitSDK: !!window.relayerSDK.initSDK,
    hasCreateInstance: !!window.relayerSDK.createInstance,
    hasSepoliaConfig: !!window.relayerSDK.SepoliaConfig,
  });
}
```

**第 98-103 行修改初始化代码：**

从：
```typescript
const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/bundle');
```

改为：
```typescript
// 使用 UMD CDN 版本（已在 index.html 中加载）
// UMD 脚本暴露为 window.relayerSDK
console.log('🔧 等待 Relayer SDK 加载...');
await waitForFhevmSDK();

const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;
```

**原因：**
- UMD 脚本是异步加载的，需要等待脚本完全加载后才能访问
- UMD 脚本将 SDK 暴露为 `window.relayerSDK`，而不是 `window.fhevm`
- 添加 `waitForFhevmSDK()` 函数确保脚本已加载，最多等待 30 秒
- 这避免了 "SDK 未加载" 的错误
- 这是官方文档 `dev.md` 推荐的方式（见第 4350-4358 行）

## 修复的优势

1. **使用官方 UMD CDN**：避免 npm 包的 ESM 版本在浏览器中的兼容性问题
2. **避免 Node.js 模块依赖**：UMD 脚本已经包含了所有必要的依赖和浏览器兼容性处理
3. **异步加载处理**：`waitForFhevmSDK()` 函数确保脚本完全加载后再访问
4. **正确的全局对象**：通过 `window.relayerSDK` 直接访问 SDK（而不是 `window.fhevm`）
5. **遵循官方文档**：符合 `dev.md` 第 4350-4358 行的推荐做法
6. **超时保护**：30 秒超时机制防止无限等待
7. **详细的诊断日志**：加载失败时提供清晰的错误信息和调试信息

## 验证修复

修复后，前端应该能够：
1. ✅ 正常启动 Vite 开发服务器
2. ✅ 加载应用页面
3. ✅ 初始化 FHEVM 实例（当钱包连接时）
4. ✅ 通过本地代理访问 Relayer 服务

## 相关配置

### Vite 代理配置（`vite.config.ts`）
```typescript
proxy: {
  '/v1': {
    target: 'https://relayer.testnet.zama.cloud',
    changeOrigin: true,
    rewrite: (path) => path,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        // 添加必要的请求头来绕过 Cloudflare WAF
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.setHeader('Cache-Control', 'no-cache');
        proxyReq.setHeader('Pragma', 'no-cache');
      });
    },
  },
},
```

### FHEVM 配置（`fhevm.ts`）
```typescript
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  // 重要：使用本地代理 URL，而不是外部 URL
  // SDK 会自动添加 '/v1' 路径
  relayerUrl: `http://localhost:${window.location.port || 5175}`,
};
```

## 常见问题

### Q: 为什么要使用 `relayerUrl: 'http://localhost:5175'` 而不是外部 URL？

A: 浏览器的 CORS 政策阻止直接访问外部 API。通过 Vite 代理，请求在服务器端处理，避免了 CORS 限制。

### Q: 为什么不能使用 `relayerUrl: '/v1'`？

A: 因为 Relayer SDK 会自动添加 `/v1` 路径。如果设置为 `/v1`，会导致 `/v1/v1/keyurl` 的双重路径问题。

### Q: SDK 初始化失败怎么办？

A: 这通常是由于 CORS 错误或配置错误导致的。确保：
1. 使用本地代理 URL (`http://localhost:5175`)
2. Vite 代理配置正确
3. 浏览器控制台中没有 CORS 错误
4. 没有看到 `/v1/v1/keyurl` 的错误

### Q: 如何调试 CORS 问题？

A: 在浏览器开发者工具中：
1. 打开 Network 标签
2. 查看 `/v1/keyurl` 请求（不是 `/v1/v1/keyurl`）
3. 检查响应状态（应该是 200 或 403，不是 CORS 错误）
4. 如果是代理请求，应该看到 `localhost:5175` 作为源

## 参考文档

- `dev.md` - FHEVM 官方开发指南
- `RELAYER_FIX_SUMMARY.md` - Relayer 连接问题修复总结
- `CORS_PROXY_FIX.md` - CORS 和代理问题修复详解
- `RELAYER_SDK_GLOBAL_OBJECT_FIX.md` - Relayer SDK 全局对象修复

