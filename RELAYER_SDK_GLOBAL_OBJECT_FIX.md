# Relayer SDK 全局对象修复

## 问题

在尝试初始化 FHEVM 时，代码一直在等待 `window.fhevm` 加载，但脚本加载后这个对象并不存在。

错误信息：
```
❌ Relayer SDK 加载超时（30秒）。请检查：
1. UMD CDN 脚本是否在 index.html 中正确加载
2. CDN URL 是否可访问：https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs
3. 浏览器控制台是否有其他错误
```

## 根本原因

UMD CDN 脚本将 SDK 暴露为 **`window.relayerSDK`**，而不是 `window.fhevm`。

这是因为 UMD 脚本的包装器代码：
```javascript
(function(Te,Ce){
  typeof exports=="object"&&typeof module<"u"?Ce(exports):
  typeof define=="function"&&define.amd?define(["exports"],Ce):
  (Te=typeof globalThis<"u"?globalThis:Te||self,Ce(Te.relayerSDK={}))
})(this,function(Te){"use strict";...})
```

关键部分：`Ce(Te.relayerSDK={})` - 这将 SDK 暴露为 `relayerSDK`，而不是 `fhevm`。

## 解决方案

### 1. 更新 Window 接口声明

在 `fhe-poker/frontend/src/lib/fhevm.ts` 中：

```typescript
declare global {
  interface Window {
    ethereum?: any;
    fhevm?: any;
    relayerSDK?: any;  // UMD CDN 脚本暴露为 relayerSDK
  }
}
```

### 2. 修改等待函数

检查 `window.relayerSDK` 而不是 `window.fhevm`：

```typescript
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
      throw new Error('Relayer SDK 加载超时（30秒）...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Relayer SDK 已加载');
}
```

### 3. 使用正确的全局对象

在初始化代码中：

```typescript
// 使用 UMD CDN 版本（已在 index.html 中加载）
// UMD 脚本暴露为 window.relayerSDK
console.log('🔧 等待 Relayer SDK 加载...');
await waitForFhevmSDK();

const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;
```

## 验证

修复后，浏览器控制台应该显示：

```
✅ Relayer SDK UMD 脚本加载完成
window.relayerSDK: {initSDK: ƒ, createInstance: ƒ, SepoliaConfig: {...}, ...}
🔍 开始检查 window.relayerSDK...
✅ Relayer SDK 已加载
📦 window.relayerSDK 对象: {
  hasInitSDK: true,
  hasCreateInstance: true,
  hasSepoliaConfig: true
}
```

## 关键要点

1. **UMD 脚本暴露为 `window.relayerSDK`**，不是 `window.fhevm`
2. **脚本是异步加载的**，需要等待加载完成
3. **使用轮询机制**检查全局对象是否存在
4. **30 秒超时保护**防止无限等待
5. **详细的诊断日志**帮助调试加载问题

## 相关文件

- `fhe-poker/frontend/src/lib/fhevm.ts` - FHEVM 初始化代码
- `fhe-poker/frontend/index.html` - UMD 脚本加载
- `fhe-poker/FHEVM_INITIALIZATION_FIX.md` - 完整的修复文档

