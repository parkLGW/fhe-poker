# 下注功能修复 - 快速参考

## 问题
```
Error: execution reverted (unknown custom error)
Error data: 0x9de3392c
```

## 根本原因
前端传递给合约的加密数据格式不正确或验证失败。

## 修复清单

### ✅ 前端修复 1: fhevm.ts
**位置**: `/frontend/src/lib/fhevm.ts` (第 118-184 行)

**修改**:
- 添加数据验证：确保 `encryptedAmount` 是 `Uint8Array`
- 添加证明验证：确保 `inputProof` 是 `Uint8Array`
- 返回正确的数据结构

**关键代码**:
```typescript
// 验证数据有效性
if (!dataToUse || !(dataToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: encryptedAmount must be Uint8Array');
}

if (!proofToUse || !(proofToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: inputProof must be Uint8Array');
}

return {
  encryptedAmount: dataToUse,
  inputProof: proofToUse,
};
```

### ✅ 前端修复 2: ContractService.ts
**位置**: `/frontend/src/services/ContractService.ts` (第 103-184 行)

**修改**:
- 验证 `encryptedAmount` 是 `Uint8Array` 且长度为 32
- 验证 `inputProof` 是 `Uint8Array` 且不为空
- 添加详细的错误日志

**关键代码**:
```typescript
// 验证 encryptedAmount
if (!(encryptedAmount instanceof Uint8Array)) {
  throw new Error(`Invalid encryptedAmount type: expected Uint8Array`);
}

if (encryptedAmount.length !== 32) {
  throw new Error(`Invalid encryptedAmount length: ${encryptedAmount.length}, expected 32`);
}

// 验证 inputProof
if (!(inputProof instanceof Uint8Array)) {
  throw new Error(`Invalid inputProof type: expected Uint8Array`);
}

if (inputProof.length === 0) {
  throw new Error('inputProof cannot be empty');
}
```

### ✅ 合约修复: PokerTable.sol
**位置**: `/contracts/PokerTable.sol` (第 1046-1104 行)

**修改**:
- 简化 `_processBet()` 函数
- 移除冗余的测试 `require` 语句
- 保留关键的验证

**关键代码**:
```solidity
// 验证证明不为空
require(inputProof.length > 0, "Invalid proof");

// 转换加密金额
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
```

## 数据流程

```
GameNew.tsx
    ↓
handleBet() 调用 fhevm.encryptBetAmount(amount)
    ↓
fhevm.ts
    ↓
encryptUint64() 返回 { encryptedAmount: Uint8Array(32), inputProof: Uint8Array }
    ↓
ContractService.ts
    ↓
bet() 验证数据格式和长度
    ↓
合约 bet() 函数
    ↓
_processBet() 验证 inputProof 并调用 FHE.fromExternal()
    ↓
✅ 下注成功
```

## 测试

### 编译
```bash
npx hardhat compile
# ✅ 编译成功
```

### 测试
```bash
npx hardhat test test/BetFunctionTest.ts
# ✅ 7 passing
```

## 验证步骤

1. 启动前端
2. 连接钱包
3. 创建游戏桌
4. 加入游戏
5. 开始游戏
6. 点击"加注"按钮
7. 输入下注金额
8. 检查浏览器控制台日志

## 预期日志

```
🔐 开始加密 uint64: { value, contractAddress, userAddress }
🔐 加密结果 - 完整对象: { keys, handles, inputProof, data, proof }
🔐 使用的数据: { dataType, dataLength, proofType, proofLength, ... }
📝 下注参数: { tableId, encryptedAmountType, inputProofType, ... }
📦 参数验证通过: { encryptedAmount, inputProof }
✅ 交易已发送: { hash }
✅ 下注成功，交易确认: { hash }
```

## 常见错误

| 错误 | 原因 | 解决 |
|-----|------|------|
| `Invalid encryptedAmount type` | 加密数据不是 Uint8Array | 检查 relayer-sdk 初始化 |
| `Invalid encryptedAmount length` | 加密数据不是 32 字节 | 检查 `handles[0]` 长度 |
| `inputProof cannot be empty` | 证明为空 | 检查 FHEVM 实例 |
| `execution reverted` | FHE.fromExternal 失败 | 检查数据格式 |

## 文件修改总结

| 文件 | 行数 | 修改 |
|-----|------|------|
| fhevm.ts | 118-184 | 添加数据验证 |
| ContractService.ts | 103-184 | 添加参数验证 |
| PokerTable.sol | 1046-1104 | 简化函数逻辑 |

## 相关文档

- [FHEVM_BET_FIX_GUIDE.md](./FHEVM_BET_FIX_GUIDE.md) - 详细修复指南
- [FINAL_BET_FIX_SUMMARY.md](./FINAL_BET_FIX_SUMMARY.md) - 完整修复总结
- [dev.md](../dev.md) - FHEVM 开发文档

## 下一步

1. 部署修复后的合约
2. 在前端测试下注功能
3. 监控日志和错误
4. 如有问题，参考常见错误表

