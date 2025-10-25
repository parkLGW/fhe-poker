# 修复尝试 3 - 使用 Buffer 而不是 Uint8Array

## 问题分析

错误 `0x9de3392c` 仍然出现，即使我们直接传递 `Uint8Array`。

## 根本原因（第三次修正）

**ethers.js 在处理 `Uint8Array` 时可能有编码问题**

虽然 `Uint8Array` 在技术上是 `BytesLike` 类型，但 ethers.js 可能在某些情况下对其编码不正确。

**解决方案：使用 `Buffer` 而不是 `Uint8Array`**

`Buffer` 是 Node.js 中的标准类型，ethers.js 对其有更好的支持。

## 修改内容

### 1. `frontend/src/services/ContractService.ts`

**修改 `joinTable()` 函数：**
```typescript
// 将 Uint8Array 转换为 Buffer
const encryptedBuyInBuffer = Buffer.from(encryptedBuyIn);
const inputProofBuffer = Buffer.from(inputProof);

const tx = await this.contract.joinTable(tableId, encryptedBuyInBuffer, inputProofBuffer);
```

**修改 `bet()` 函数：**
```typescript
// 将 Uint8Array 转换为 Buffer
const encryptedAmountBuffer = Buffer.from(encryptedAmount);
const inputProofBuffer = Buffer.from(inputProof);

const tx = await this.contract.bet(tableId, encryptedAmountBuffer, inputProofBuffer);
```

### 2. `frontend/src/lib/ethers-contract.ts`

**修改 `callBet()` 函数：**
```typescript
// 将 Uint8Array 转换为 Buffer
const encryptedDataBuffer = Buffer.from(encryptedData);
const inputProofBuffer = Buffer.from(inputProof);

const tx = await contract.bet(tableId, encryptedDataBuffer, inputProofBuffer);
```

**修改 `callJoinTable()` 函数：**
```typescript
// 将 Uint8Array 转换为 Buffer
const encryptedBuyInBuffer = Buffer.from(encryptedBuyIn);
const inputProofBuffer = Buffer.from(inputProof);

const tx = await contract.joinTable(tableId, encryptedBuyInBuffer, inputProofBuffer);
```

## 为什么使用 Buffer

1. **标准化**：Buffer 是 Node.js 和浏览器中处理二进制数据的标准方式
2. **ethers.js 支持**：ethers.js 对 Buffer 有更好的支持和优化
3. **编码一致性**：Buffer 确保数据被正确编码为 `bytes32` 和 `bytes`
4. **兼容性**：Buffer 可以在浏览器中使用（通过 polyfill）

## 测试步骤

1. **清除浏览器缓存**
   - F12 → 右键刷新 → 清空缓存并硬性重新加载

2. **测试下注**
   - 创建游戏桌
   - 加入游戏
   - 开始游戏
   - 尝试下注

3. **验证**
   - 浏览器控制台显示 `🔄 转换后的参数:` 日志
   - 参数类型为 `Buffer`
   - 交易成功
   - 没有 `0x9de3392c` 错误

## 预期结果

✅ 下注交易成功
✅ 游戏状态正确更新
✅ 没有 `InvalidEncryptedAmount` 错误
✅ 加入游戏功能正常

## 修改统计

- 修改的函数：4
- 修改的文件：2
- 新增的转换逻辑：8 行

## 关键改变

**之前（直接使用 Uint8Array）：**
```typescript
const tx = await this.contract.bet(tableId, encryptedAmount, inputProof);
```

**现在（使用 Buffer）：**
```typescript
const encryptedAmountBuffer = Buffer.from(encryptedAmount);
const inputProofBuffer = Buffer.from(inputProof);
const tx = await this.contract.bet(tableId, encryptedAmountBuffer, inputProofBuffer);
```

## 参考

- ethers.js BytesLike 文档：https://docs.ethers.org/v6/api/utils/#BytesLike
- Node.js Buffer 文档：https://nodejs.org/api/buffer.html

