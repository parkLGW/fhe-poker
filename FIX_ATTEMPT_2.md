# 修复尝试 2 - 错误 0x9de3392c (InvalidEncryptedAmount)

## 问题分析

第一次修复尝试（显式转换为 hex 字符串）仍然导致 `0x9de3392c` 错误。

## 根本原因（修正）

经过仔细分析 dev.md 中的示例代码，发现：

**正确的做法是直接传递 `Uint8Array`，而不是转换为 hex 字符串**

在 dev.md 中的示例：
```typescript
const tx = await fheCounterContract.connect(signers.alice).increment(
  encryptedOne.handles[0],  // 直接传递 Uint8Array
  encryptedOne.inputProof   // 直接传递 Uint8Array
);
```

ethers.js v6 会自动将 `Uint8Array` 转换为合适的格式（`bytes32` 或 `bytes`）。

## 修复方案（第二次尝试）

**撤销 hex 转换，直接使用 Uint8Array**

### 修改的文件

#### 1. `frontend/src/services/ContractService.ts`

**修改 `joinTable()` 函数：**
```typescript
// 直接使用 Uint8Array，ethers.js 会自动处理转换
console.log('🔄 参数类型检查:');
console.log('  - encryptedBuyIn 类型:', encryptedBuyIn.constructor.name, '长度:', encryptedBuyIn.length);
console.log('  - inputProof 类型:', inputProof.constructor.name, '长度:', inputProof.length);

const tx = await this.contract.joinTable(tableId, encryptedBuyIn, inputProof);
```

**修改 `bet()` 函数：**
```typescript
// 直接使用 Uint8Array，ethers.js 会自动处理转换
console.log('🔄 参数类型检查:');
console.log('  - encryptedAmount 类型:', encryptedAmount.constructor.name, '长度:', encryptedAmount.length);
console.log('  - inputProof 类型:', inputProof.constructor.name, '长度:', inputProof.length);

const tx = await this.contract.bet(tableId, encryptedAmount, inputProof);
```

#### 2. `frontend/src/lib/ethers-contract.ts`

**修改 `callBet()` 函数：**
```typescript
// 直接使用 Uint8Array，ethers.js 会自动处理转换
console.log('🔄 参数类型检查:');
console.log('  - encryptedData 类型:', encryptedData.constructor.name, '长度:', encryptedData.length);
console.log('  - inputProof 类型:', inputProof.constructor.name, '长度:', inputProof.length);

const tx = await contract.bet(tableId, encryptedData, inputProof);
```

**修改 `callJoinTable()` 函数：**
```typescript
// 直接使用 Uint8Array，ethers.js 会自动处理转换
console.log('🔄 参数类型检查:');
console.log('  - encryptedBuyIn 类型:', encryptedBuyIn.constructor.name, '长度:', encryptedBuyIn.length);
console.log('  - inputProof 类型:', inputProof.constructor.name, '长度:', inputProof.length);

const tx = await contract.joinTable(tableId, encryptedBuyIn, inputProof);
```

#### 3. 删除不必要的导入

- 从 `ContractService.ts` 删除 `import { uint8ArrayToHex } from '../lib/fhevm';`
- 从 `ethers-contract.ts` 删除 `import { uint8ArrayToHex } from './fhevm';`
- 从 `fhevm.ts` 删除 `uint8ArrayToHex()` 函数

## 技术原理

### ethers.js v6 的自动类型转换

ethers.js v6 支持 `BytesLike` 类型，包括：
- `Uint8Array`
- `string` (hex 格式)
- `Buffer`
- 等等

当传递 `Uint8Array` 给合约函数时，ethers.js 会自动：
1. 识别参数类型为 `bytes32` 或 `bytes`
2. 将 `Uint8Array` 转换为正确的格式
3. 进行 ABI 编码

### 为什么 hex 字符串转换失败

虽然 hex 字符串在技术上也是 `BytesLike`，但在某些情况下可能导致：
- 编码格式不匹配
- 数据长度计算错误
- FHEVM 验证失败

## 测试步骤

1. **清除浏览器缓存**
   - 打开开发者工具 (F12)
   - 右键点击刷新按钮，选择"清空缓存并硬性重新加载"

2. **测试下注功能**
   - 创建游戏桌
   - 加入游戏
   - 开始游戏
   - 尝试下注

3. **验证修复**
   - 浏览器控制台应显示 `🔄 参数类型检查:` 日志
   - 确认参数类型为 `Uint8Array`
   - 交易应成功发送和确认
   - 不应出现 `0x9de3392c` 错误

## 预期结果

修复后，下注操作应该能够成功完成：
- ✅ 下注交易成功
- ✅ 游戏状态正确更新
- ✅ 没有 `InvalidEncryptedAmount` 错误
- ✅ 加入游戏功能也正常工作

## 参考

- FHEVM 文档：https://docs.zama.ai/protocol/solidity-guides/
- ethers.js 文档：https://docs.ethers.org/v6/
- dev.md 中的示例代码

