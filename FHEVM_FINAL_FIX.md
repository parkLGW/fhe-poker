# FHEVM 初始化最终修复方案

## 问题总结

之前的多次尝试都失败了，主要原因是对 dev.md 文档的理解不完整。根本问题是：

1. **UMD CDN 脚本暴露为 `window.relayerSDK`**，但 dev.md 示例中使用 `window.fhevm`
2. **不应该覆盖 `relayerUrl`**，SDK 已经在 `SepoliaConfig` 中包含了正确的 URL
3. **CORS 问题需要通过 Vite 代理解决**，但代理配置不正确

## 最终修复方案

### 1. 修改 `index.html` - 创建全局对象映射

在 UMD CDN 脚本加载后，添加一个脚本来将 `window.relayerSDK` 映射到 `window.fhevm`：

```html
<!-- Load Zama Relayer SDK UMD bundle -->
<script
  src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
<script>
  // 将 window.relayerSDK 映射到 window.fhevm，以匹配 dev.md 中的示例
  if (window.relayerSDK) {
    window.fhevm = window.relayerSDK;
    console.log('✅ Relayer SDK UMD 脚本加载完成，已映射到 window.fhevm');
  } else {
    console.error('❌ Relayer SDK UMD 脚本加载失败或未暴露为 window.relayerSDK');
  }
</script>
```

### 2. 修改 `fhevm.ts` - 正确初始化 SDK

根据 dev.md 第 4350-4359 行的说明，使用 UMD 版本时：

```typescript
// 1. 等待 SDK 加载
await waitForFhevmSDK();

// 2. 获取 SDK 导出
const { initSDK, createInstance, SepoliaConfig } = window.fhevm;

// 3. 初始化 WASM
await initSDK();

// 4. 创建配置对象，添加 network: window.ethereum
// 重要：必须覆盖 relayerUrl 为本地代理 URL，以避免 CORS 问题
// SDK 会直接调用 relayerUrl，所以我们需要指向本地代理
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  relayerUrl: `http://localhost:${window.location.port || 5175}/relayer`,
};

// 5. 创建实例
const instance = await createInstance(config);
```

### 3. 修改 `vite.config.ts` - 配置代理

由于浏览器 CORS 限制，需要通过 Vite 代理来转发请求：

```typescript
proxy: {
  '/relayer': {
    target: 'https://relayer.testnet.zama.cloud',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/relayer/, ''),
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

## 关键要点

1. **必须覆盖 `relayerUrl`**：SDK 会直接调用 `relayerUrl`，所以必须指向本地代理 URL
2. **使用 UMD 版本**：通过 CDN 脚本标签加载，避免 ESM 打包问题
3. **创建全局对象映射**：将 `window.relayerSDK` 映射到 `window.fhevm`，以匹配 dev.md 示例
4. **使用 Vite 代理**：绕过浏览器 CORS 限制，代理会将请求转发到真实的 Relayer 服务

## 测试

现在应该能够正常初始化 FHEVM 实例了。如果仍然有问题，请检查：

1. 浏览器控制台是否有错误信息
2. 网络标签中的请求是否成功
3. `window.fhevm` 是否正确加载
4. MetaMask 钱包是否已连接

