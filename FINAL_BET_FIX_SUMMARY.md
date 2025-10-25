# 下注功能修复总结 - 最终版本

## 问题回顾

用户在游戏页面点击"加注"按钮时，出现以下错误：
```
ContractService.ts:153 ❌ 下注失败: Error: execution reverted (unknown custom error)
Error data: 0x9de3392c...
```

## 修复内容

### 1. 前端修复 - fhevm.ts

**文件**: `/frontend/src/lib/fhevm.ts`

**修改内容**:
- 在 `encryptUint64()` 函数中添加严格的数据验证
- 在 `encryptUint8()` 函数中添加严格的数据验证
- 确保返回的 `encryptedAmount` 和 `inputProof` 都是有效的 `Uint8Array` 实例

**关键代码**:
```typescript
// 验证加密数据有效性
if (!dataToUse || !(dataToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: encryptedAmount must be Uint8Array');
}

if (!proofToUse || !(proofToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: inputProof must be Uint8Array');
}
```

### 2. 前端修复 - ContractService.ts

**文件**: `/frontend/src/services/ContractService.ts`

**修改内容**:
- 增强 `bet()` 函数的参数验证
- 验证 `encryptedAmount` 是 `Uint8Array` 且长度为 32 字节
- 验证 `inputProof` 是 `Uint8Array` 且不为空
- 添加详细的错误日志

**关键代码**:
```typescript
// 验证 encryptedAmount 是 Uint8Array 且长度为 32
if (!(encryptedAmount instanceof Uint8Array)) {
  throw new Error(`Invalid encryptedAmount type: expected Uint8Array`);
}

if (encryptedAmount.length !== 32) {
  throw new Error(`Invalid encryptedAmount length: ${encryptedAmount.length}, expected 32`);
}

// 验证 inputProof 是 Uint8Array 且不为空
if (!(inputProof instanceof Uint8Array)) {
  throw new Error(`Invalid inputProof type: expected Uint8Array`);
}

if (inputProof.length === 0) {
  throw new Error('inputProof cannot be empty');
}
```

### 3. 合约修复 - PokerTable.sol

**文件**: `/contracts/PokerTable.sol`

**修改内容**:
- 简化 `_processBet()` 函数，移除冗余的测试 `require` 语句
- 保留关键的验证检查
- 确保 `FHE.fromExternal()` 调用正确处理加密数据

**关键代码**:
```solidity
// 验证证明不为空 - 这是关键检查
require(inputProof.length > 0, "Invalid proof");

// 验证并转换加密金额
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
```

## 技术细节

### 数据流程

1. **前端加密**:
   - `GameNew.tsx` 调用 `fhevm.encryptBetAmount(amount)`
   - `fhevm.ts` 使用 relayer-sdk 创建加密输入
   - 返回 `{ encryptedAmount: Uint8Array(32), inputProof: Uint8Array }`

2. **前端验证**:
   - `ContractService.ts` 验证数据格式和长度
   - 确保 `encryptedAmount` 是 32 字节
   - 确保 `inputProof` 不为空

3. **合约处理**:
   - `bet()` 函数接收 `encryptedAmount` (bytes32) 和 `inputProof` (bytes)
   - `_processBet()` 验证 `inputProof` 长度
   - `FHE.fromExternal()` 转换加密数据为 `euint64`

### 关键类型映射

| 前端类型 | Solidity 类型 | 说明 |
|---------|-------------|------|
| Uint8Array(32) | bytes32 | 加密金额句柄 |
| Uint8Array | bytes | 零知识证明 |

## 测试

### 编译测试
```bash
npx hardhat compile
# ✅ 编译成功
```

### 单元测试
```bash
npx hardhat test test/BetFunctionTest.ts
# ✅ 7 passing (69ms)
```

## 验证步骤

### 本地测试
1. 启动前端开发服务器
2. 连接钱包
3. 创建游戏桌
4. 加入游戏
5. 开始游戏
6. 尝试下注
7. 检查浏览器控制台日志

### 预期日志输出
```
🔐 开始加密 uint64: { value, contractAddress, userAddress }
🔐 加密结果 - 完整对象: { keys, handles, inputProof, data, proof }
📝 下注参数: { tableId, encryptedAmountType, inputProofType, ... }
📦 参数验证通过: { encryptedAmount, inputProof }
✅ 交易已发送: { hash }
✅ 下注成功，交易确认: { hash }
```

## 常见问题排查

### 问题 1: "Invalid encryptedAmount length"
- **原因**: relayer-sdk 返回的加密数据不是 32 字节
- **解决**: 检查 `encryptedInput.handles[0]` 的长度

### 问题 2: "inputProof cannot be empty"
- **原因**: relayer-sdk 没有返回有效的证明
- **解决**: 检查 FHEVM 实例初始化是否正确

### 问题 3: "execution reverted (unknown custom error)"
- **原因**: `FHE.fromExternal()` 验证失败
- **解决**: 检查加密数据和证明的格式是否匹配

## 相关文件

- ✅ `/frontend/src/lib/fhevm.ts` - 已修复
- ✅ `/frontend/src/services/ContractService.ts` - 已修复
- ✅ `/contracts/PokerTable.sol` - 已修复
- ✅ `/test/BetFunctionTest.ts` - 新增测试
- ✅ `/FHEVM_BET_FIX_GUIDE.md` - 修复指南

## 下一步

1. **部署合约**: 将修复后的合约部署到测试网络
2. **前端测试**: 在实际游戏中测试下注功能
3. **监控日志**: 观察浏览器控制台和合约事件
4. **性能优化**: 如果需要，优化加密和验证性能

## 总结

这次修复的关键是：
1. **严格的数据验证**: 确保前端传递的数据格式正确
2. **清晰的错误消息**: 帮助快速定位问题
3. **简化的合约逻辑**: 移除冗余代码，专注于核心功能

修复后，下注功能应该能够正常工作。

