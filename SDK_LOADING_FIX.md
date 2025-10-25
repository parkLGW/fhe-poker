# SDK 加载问题修复 - 完整解决方案

## 问题分析

### 错误 1：`TypeError: Cannot read properties of undefined (reading 'initSDK')`

**根本原因**：`@zama-fhe/relayer-sdk/bundle.js` 只有 4 行代码，依赖于 `window.relayerSDK` 全局对象。但代码直接导入 `bundle.js` 而没有先加载 UMD 脚本。

### 错误 2：`WebAssembly.instantiateStreaming failed because your server does not serve Wasm with 'application/wasm' MIME type`

**根本原因**：Vite 开发服务器没有为 `.wasm` 文件设置正确的 MIME 类型。

### 错误 3：`Impossible to fetch public key: wrong relayer url`

**根本原因**：`SepoliaConfig` 中的 `relayerUrl` 可能不正确或为空。

## 解决方案

### 1. 在 `index.html` 中加载 UMD 脚本

```html
<!-- Load the Relayer SDK UMD bundle first -->
<script src="/node_modules/@zama-fhe/relayer-sdk/bundle/relayer-sdk-js.umd.cjs"></script>
```

添加 COOP/COEP 元标签：

```html
<meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin" />
<meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp" />
```

### 2. 修改 `fhevm.ts` 中的 SDK 加载逻辑

```typescript
// 等待 SDK 加载完成
async function waitForSDK() {
  let attempts = 0;
  const maxAttempts = 100; // 10 秒超时 (100 * 100ms)

  while (!window.relayerSDK && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.relayerSDK) {
    throw new Error('SDK 加载超时：window.relayerSDK 未定义');
  }

  console.log('✅ SDK 已加载');
  return window.relayerSDK;
}
```

### 3. 确保使用正确的 Relayer URL

```typescript
const config = {
  ...SepoliaConfig,
  network: window.ethereum,
  // 确保使用正确的 relayer URL
  relayerUrl: 'https://relayer.testnet.zama.cloud',
};
```

### 4. Vite 配置（WASM MIME 类型）

虽然 Vite 应该自动处理 WASM MIME 类型，但如果仍有问题，可以在 `vite.config.ts` 中添加自定义中间件。

## 修改的文件

1. **fhe-poker/frontend/index.html**
   - 添加 UMD 脚本加载
   - 添加 COOP/COEP 元标签

2. **fhe-poker/frontend/src/lib/fhevm.ts**
   - 替换 `loadSDK()` 为 `waitForSDK()`
   - 更新 `initFHEVM()` 函数来使用新的 SDK 加载方式
   - 明确设置 `relayerUrl` 为 `https://relayer.testnet.zama.cloud`

3. **fhe-poker/frontend/vite.config.ts**
   - 确保 WASM 文件被正确处理

## 工作流程

1. HTML 页面加载时，首先加载 UMD 脚本
2. UMD 脚本将 SDK 暴露到 `window.relayerSDK`
3. React 应用加载时，`useFHEVM` 钩子调用 `initFHEVM()`
4. `initFHEVM()` 调用 `waitForSDK()` 等待全局对象
5. 一旦 `window.relayerSDK` 可用，就可以安全地解构 `initSDK`、`createInstance` 等
6. 使用正确的 relayer URL 创建 FHEVM 实例

## 测试页面

- `/test-sdk-load.html` - 验证 SDK 是否被正确加载
- `/test-config.html` - 查看 SepoliaConfig 的内容

