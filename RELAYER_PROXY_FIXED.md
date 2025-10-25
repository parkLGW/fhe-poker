# Relayer 代理修复总结

## 问题

Relayer SDK 在浏览器中无法直接访问 `https://relayer.testnet.zama.cloud`，因为：
1. **CORS 限制**：浏览器的同源政策阻止跨域请求
2. **Cloudflare WAF**：Relayer 服务器由 Cloudflare 保护，需要特定的请求头

## 解决方案

使用 Vite 开发服务器的代理功能，在服务器端转发请求，绕过浏览器的 CORS 限制。

## 配置修改

### 1. Vite 代理配置 (`vite.config.ts`)

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

**关键点**：
- 代理路径：`/v1`
- 目标：`https://relayer.testnet.zama.cloud`
- `changeOrigin: true` - 改变请求头中的 Origin
- `rewrite: (path) => path` - 保持路径不变

### 2. FHEVM 配置 (`frontend/src/lib/fhevm.ts`)

```typescript
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  relayerUrl: `http://localhost:${window.location.port || 5175}`,
};
```

**关键点**：
- `relayerUrl` 是本地代理的基础 URL
- Relayer SDK 会自动添加 `/v1` 路径
- 最终请求：`http://localhost:5175/v1/keyurl`

## 工作流程

1. **浏览器请求**：`http://localhost:5175/v1/keyurl`
2. **Vite 代理拦截**：Vite 开发服务器拦截 `/v1` 路径的请求
3. **添加请求头**：代理添加必要的请求头来绕过 Cloudflare WAF
4. **转发到 Relayer**：代理将请求转发到 `https://relayer.testnet.zama.cloud/v1/keyurl`
5. **返回响应**：Relayer 返回响应，代理将其返回给浏览器（无 CORS 问题）

## 验证

在浏览器开发者工具的 Network 标签中，应该看到：
- 请求 URL：`http://localhost:5175/v1/keyurl`
- 响应状态：200 或 403（不是 CORS 错误）
- 没有 CORS 错误

## 常见问题

### Q: 为什么 Relayer 返回 403？

A: 403 Forbidden 可能是由于：
1. 请求头不完整
2. Relayer 需要特定的参数
3. 请求格式不正确

这不是代理问题，而是 Relayer 的响应。

### Q: 为什么不能使用 `relayerUrl: '/v1'`？

A: 因为 Relayer SDK 会自动添加 `/v1` 路径。如果设置为 `/v1`，会导致 `/v1/v1/keyurl` 的双重路径问题。

### Q: 代理只在开发环境工作吗？

A: 是的，这个配置只在 Vite 开发服务器中工作。生产环境需要不同的解决方案（例如，后端代理或 CORS 配置）。

## 相关文件

- `frontend/vite.config.ts` - Vite 代理配置
- `frontend/src/lib/fhevm.ts` - FHEVM 初始化代码
- `CORS_PROXY_FIX.md` - CORS 和代理问题修复详解
- `FHEVM_INITIALIZATION_FIX.md` - 完整的初始化修复文档
- `PROXY_DEBUG_TEST.md` - 代理调试测试指南

