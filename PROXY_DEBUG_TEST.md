# 代理调试测试指南

## 问题诊断

### 症状 1: `/v1/v1/keyurl` 错误

**原因**：`relayerUrl` 被设置为 `/v1`，而 Relayer SDK 又添加了 `/v1` 路径。

**解决方案**：`relayerUrl` 应该是基础 URL，例如 `http://localhost:5175`，SDK 会自动添加 `/v1`。

### 症状 2: CORS 错误

**原因**：浏览器直接访问外部 API，被 CORS 政策阻止。

**解决方案**：使用 Vite 代理，让请求通过本地服务器转发。

## 测试步骤

### 步骤 1: 验证 Vite 代理配置

打开浏览器开发者工具 (F12)，在控制台中运行：

```javascript
// 测试代理是否工作
fetch('http://localhost:5175/v1/keyurl')
  .then(r => {
    console.log('✅ 代理响应状态:', r.status);
    console.log('✅ 响应头:', {
      'content-type': r.headers.get('content-type'),
      'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
    });
    return r.json();
  })
  .then(d => console.log('✅ 代理工作，响应数据:', d))
  .catch(e => console.log('❌ 代理失败:', e.message));
```

**预期结果**：
- 状态码：200 或 403（如果 Relayer 返回 403，说明代理工作了）
- 没有 CORS 错误

### 步骤 2: 检查 FHEVM 配置

在浏览器控制台中查看日志：

```
🔧 配置对象: {
  hasNetwork: true,
  networkType: 'object',
  chainId: 11155111,
  gatewayChainId: 55815,
  relayerUrl: 'http://localhost:5175'
}
```

**关键点**：
- `relayerUrl` 应该是 `http://localhost:5175`（或其他端口）
- 不应该包含 `/v1` 路径

### 步骤 3: 检查网络请求

在浏览器开发者工具的 Network 标签中：

1. 查找 `/v1/keyurl` 请求
2. 检查请求 URL：应该是 `http://localhost:5175/v1/keyurl`
3. 检查响应状态：应该是 200 或 403（不是 CORS 错误）
4. 检查响应头：应该没有 CORS 错误

### 步骤 4: 验证 SDK 初始化

查看浏览器控制台日志：

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

## 常见问题

### Q: 为什么还是看到 `/v1/v1/keyurl`？

A: 这意味着 `relayerUrl` 被设置为 `/v1`。应该改为 `http://localhost:5175`。

### Q: 为什么看到 CORS 错误？

A: 这意味着请求没有通过代理。检查：
1. Vite 代理配置是否正确
2. `relayerUrl` 是否使用本地 URL
3. 浏览器是否正确加载了新的代码

### Q: 代理返回 403 是正常的吗？

A: 是的，如果 Relayer 返回 403，说明代理工作了。403 可能是由于请求头或其他原因。

## 修复步骤

### 1. 检查 vite.config.ts

```typescript
proxy: {
  '/v1': {
    target: 'https://relayer.testnet.zama.cloud',
    changeOrigin: true,
    rewrite: (path) => path,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 ...');
        proxyReq.setHeader('Accept', 'application/json');
        // ... 其他请求头
      });
    },
  },
},
```

### 2. 检查 fhevm.ts

```typescript
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  relayerUrl: `http://localhost:${window.location.port || 5175}`,
};
```

### 3. 重启 Vite 开发服务器

```bash
# 停止当前的 Vite 服务器
# 然后重新启动
npm run dev
```

### 4. 清除浏览器缓存

- 打开开发者工具 (F12)
- 右键点击刷新按钮，选择"清空缓存并硬性重新加载"
- 或者按 Ctrl+Shift+Delete 打开清除浏览数据对话框

## 参考文档

- `CORS_PROXY_FIX.md` - CORS 和代理问题修复详解
- `FHEVM_INITIALIZATION_FIX.md` - 完整的初始化修复文档
- `dev.md` - FHEVM 官方开发指南

