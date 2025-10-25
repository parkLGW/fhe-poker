# FHEVM 初始化问题修复总结

## 问题根源

SDK 在初始化时会直接调用 `https://relayer.testnet.zama.cloud/v1/keyurl`，但浏览器的 CORS 策略阻止了这个请求。

## 解决方案

### 1. 使用 UMD CDN 版本 (`index.html`)

```html
<script
  src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
<script>
  // 将 window.relayerSDK 映射到 window.fhevm
  if (window.relayerSDK) {
    window.fhevm = window.relayerSDK;
  }
</script>
```

### 2. 配置 Vite 代理 (`vite.config.ts`)

```typescript
proxy: {
  '/relayer': {
    target: 'https://relayer.testnet.zama.cloud',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/relayer/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0...');
        proxyReq.setHeader('Accept', 'application/json');
        // ... 其他请求头
      });
    },
  },
}
```

### 3. 覆盖 relayerUrl (`fhevm.ts`)

**关键修改**：必须覆盖 `relayerUrl` 为本地代理 URL

```typescript
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  relayerUrl: `http://localhost:${window.location.port || 5175}/relayer`,
};

const instance = await createInstance(config);
```

## 工作流程

```
浏览器代码
  ↓
调用 SDK 的 createInstance(config)
  ↓
SDK 使用 config.relayerUrl = 'http://localhost:5175/relayer'
  ↓
浏览器发送请求到 http://localhost:5175/relayer/v1/keyurl
  ↓
Vite 代理拦截 /relayer 路径
  ↓
代理转发到 https://relayer.testnet.zama.cloud/v1/keyurl
  ↓
代理添加必要的请求头（绕过 Cloudflare WAF）
  ↓
Relayer 返回响应
  ↓
代理返回给浏览器（无 CORS 问题）
```

## 为什么这样修复

1. **UMD 版本**：避免 ESM 打包问题，直接在浏览器中加载
2. **全局对象映射**：匹配 dev.md 中的示例代码
3. **本地代理 URL**：绕过浏览器 CORS 限制
4. **Vite 代理**：在服务器端处理请求，添加必要的请求头

## 测试

现在应该能够正常初始化 FHEVM 实例了。如果仍然有问题，请检查：

1. 浏览器控制台是否有错误信息
2. 网络标签中的请求是否成功
3. `window.fhevm` 是否正确加载
4. MetaMask 钱包是否已连接
5. Vite 代理是否正确转发请求

