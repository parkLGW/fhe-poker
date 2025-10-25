# CORS 和代理问题修复

## 问题

初始化 FHEVM 时出现 CORS 错误：

```
Access to fetch at 'https://relayer.testnet.zama.cloud/v1/keyurl' from origin 'http://localhost:5175' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

同时还有 SDK 初始化错误：
```
Error: called `Result::unwrap_throw()` on an `Err` value
```

## 根本原因

1. **CORS 限制**：浏览器无法直接访问 `https://relayer.testnet.zama.cloud`
2. **代理未被使用**：代码使用的是 `SepoliaConfig` 中的外部 URL，而不是本地代理
3. **Vite 代理配置存在但未被利用**：`vite.config.ts` 中配置了 `/v1` 代理，但代码没有使用它

## 解决方案

### 修改 `fhe-poker/frontend/src/lib/fhevm.ts`

在创建 FHEVM 配置时，使用本地代理 URL 而不是外部 URL：

```typescript
// 创建配置对象，添加 window.ethereum
// 重要：使用本地代理 URL 而不是外部 URL，以避免 CORS 问题
// SepoliaConfig 中的 relayerUrl 是 'https://relayer.testnet.zama.cloud'
// SDK 会自动添加 '/v1' 路径，所以我们需要使用 'http://localhost:5175' 作为基础 URL
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  relayerUrl: `http://localhost:${window.location.port || 5175}`,  // 使用本地代理基础 URL
};
```

**重要**：不要设置 `relayerUrl: '/v1'`，这会导致 `/v1/v1/keyurl` 的双重路径问题！

### Vite 代理配置（`vite.config.ts`）

代理配置已经正确设置：

```typescript
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
},
```

## 工作原理

1. **FHEVM 配置**：`relayerUrl: 'http://localhost:5175'`
2. **SDK 构建 URL**：Relayer SDK 自动添加 `/v1` 路径，构建完整 URL：`http://localhost:5175/v1/keyurl`
3. **浏览器请求**：浏览器发送请求到 `http://localhost:5175/v1/keyurl`
4. **Vite 代理拦截**：Vite 开发服务器拦截 `/v1` 路径的请求
5. **转发到 Relayer**：代理将请求转发到 `https://relayer.testnet.zama.cloud/v1/keyurl`
6. **添加请求头**：代理添加必要的请求头（User-Agent、Accept 等）来绕过 Cloudflare WAF
7. **返回响应**：Relayer 返回响应，代理将其返回给浏览器（无 CORS 问题）

## 关键要点

1. **使用本地基础 URL**：`relayerUrl: 'http://localhost:5175'` 而不是 `'https://relayer.testnet.zama.cloud'`
   - SDK 会自动添加 `/v1` 路径
   - 不要设置 `relayerUrl: '/v1'`，这会导致双重路径问题
2. **Vite 代理处理 CORS**：代理在服务器端处理请求，避免浏览器 CORS 限制
3. **请求头配置**：代理添加必要的请求头来绕过 Cloudflare WAF
4. **COOP/COEP 头**：Vite 配置中的 COOP/COEP 头支持 SharedArrayBuffer
5. **动态端口**：使用 `window.location.port` 确保在不同端口上也能工作

## 验证

修复后，浏览器控制台应该显示：

```
✅ Relayer SDK 已加载
🔧 等待 Relayer SDK 加载...
🔧 开始初始化 SDK...
🔧 正在加载 WASM 模块...
✅ SDK 初始化完成
🔧 开始创建 FHEVM 实例...
🔧 使用 SepoliaConfig 并添加 network...
🔧 配置对象: {
  hasNetwork: true,
  networkType: 'object',
  chainId: 11155111,
  gatewayChainId: 55815,
  relayerUrl: 'http://localhost:5175'
}
✅ FHEVM 实例创建成功
```

**重要**：
- `relayerUrl` 应该是 `http://localhost:5175`（或其他端口）
- 不应该看到 `/v1/v1/keyurl` 的错误
- 不应该看到 CORS 错误

## 相关文件

- `fhe-poker/frontend/vite.config.ts` - Vite 代理配置
- `fhe-poker/frontend/src/lib/fhevm.ts` - FHEVM 初始化代码
- `fhe-poker/FHEVM_INITIALIZATION_FIX.md` - 完整的初始化修复文档

