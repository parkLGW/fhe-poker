# FHEVM 初始化最终解决方案

## 问题总结

前端在初始化 FHEVM 时遇到 **403 Forbidden** 错误：
```
GET https://relayer.testnet.zama.cloud/v1/keyurl 403 (Forbidden)
```

这个错误发生在 SDK 尝试从 Relayer 服务获取加密密钥时。

## 根本原因分析

经过多次尝试和调试，我发现了以下问题：

1. **UMD vs ESM 版本**：之前尝试使用 UMD CDN 版本，但这导致了复杂的全局对象映射问题
2. **CORS 限制**：浏览器无法直接访问 Relayer 服务
3. **Relayer 403 错误**：即使通过代理，Relayer 仍然返回 403
4. **错误的 SDK 版本**：最初使用了 `/web` 版本，但应该使用 `/bundle` 版本

## 最终解决方案

### 1. 使用 npm 包中的 `/bundle` 版本

修改 `fhe-poker/frontend/src/lib/fhevm.ts`：

```typescript
// 导入 FHEVM SDK（使用 /bundle 版本）
// 根据 dev.md 第 4260 和 4276 行，应该使用 /bundle 版本
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
```

**优点**：
- 这是官方推荐的版本（见 dev.md 第 4260 和 4276 行）
- 避免了 UMD 全局对象映射的复杂性
- 直接使用 npm 包，版本管理更清晰

### 2. 简化 index.html

移除了 UMD CDN 脚本加载和全局对象映射：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3. 简化初始化代码

```typescript
export async function initFHEVM(chainId: number = 11155111): Promise<FhevmInstance> {
  // 浏览器兼容性检查
  if (!window.crossOriginIsolated) {
    throw new Error('浏览器环境不支持 FHEVM：缺少 Cross-Origin Isolation');
  }

  // 初始化 WASM
  await initSDK();

  // 创建配置
  const config = {
    ...SepoliaConfig,
    network: window.ethereum,
  };

  // 创建实例
  const instance = await createInstance(config);
  return instance;
}
```

### 4. Vite 配置

保持 COOP/COEP 头部设置以支持 SharedArrayBuffer：

```typescript
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
  // ... 其他配置
}
```

## 关键改进

1. **代码简化**：移除了复杂的 UMD 加载和全局对象映射逻辑
2. **官方推荐**：使用官方推荐的 `/bundle` 版本（见 dev.md 第 4260 和 4276 行）
3. **更好的错误处理**：直接使用 npm 包，错误信息更清晰
4. **版本管理**：通过 npm 管理 SDK 版本，而不是依赖 CDN

## 测试步骤

1. 连接 MetaMask 钱包到 Sepolia 测试网
2. 刷新页面（http://localhost:5173）
3. 检查浏览器控制台中的日志
4. 如果仍然有 403 错误，这可能是 Relayer 服务本身的问题

## 可能的后续问题

如果仍然遇到 403 错误，可能的原因包括：

1. **Relayer 服务不可用**：检查 https://relayer.testnet.zama.cloud 是否在线
2. **IP 限制**：Relayer 可能有 IP 白名单
3. **API 密钥**：Relayer 可能需要 API 密钥
4. **请求格式**：Relayer 可能期望不同的请求格式

## 文件修改总结

- `fhe-poker/frontend/index.html` - 移除 UMD 脚本加载
- `fhe-poker/frontend/src/lib/fhevm.ts` - 使用 npm 包的 `/bundle` 版本
- `fhe-poker/frontend/vite.config.ts` - 保持 COOP/COEP 头部设置

## 关键发现

根据 dev.md 的官方文档，正确的导入方式是：

```typescript
// 第 1 步：导入 SDK
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

// 第 2 步：初始化 WASM
await initSDK();

// 第 3 步：创建实例
const config = { ...SepoliaConfig, network: window.ethereum };
const instance = await createInstance(config);
```

这是官方推荐的方式，避免了之前尝试的 UMD CDN 方式的复杂性。

