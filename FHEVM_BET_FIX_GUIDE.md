# FHEVM 下注功能修复指南

## 问题描述

前端调用合约的 `bet` 函数时出现错误：
```
Error: execution reverted (unknown custom error)
Error data: 0x9de3392c...
```

## 根本原因分析

### 1. 加密数据格式问题
- **前端问题**：`encryptUint64` 和 `encryptUint8` 函数返回的加密数据可能格式不正确
- **合约问题**：`_processBet` 函数中的 `FHE.fromExternal` 调用失败

### 2. 数据类型不匹配
- **ABI 定义**：
  - `encryptedAmount` 应该是 `bytes32` 类型
  - `inputProof` 应该是 `bytes` 类型
- **前端传递**：
  - `encryptedAmount` 是 `Uint8Array`（32字节）
  - `inputProof` 是 `Uint8Array`（可变长度）

### 3. 验证失败
- 合约中第1075行：`require(inputProof.length > 0, "Invalid proof")`
- 如果 `inputProof` 为空或格式不正确，此检查会失败

## 修复方案

### 前端修复 (fhevm.ts)

#### 1. 增强数据验证
```typescript
// 验证加密数据有效性
if (!dataToUse || !(dataToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: encryptedAmount must be Uint8Array');
}

if (!proofToUse || !(proofToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: inputProof must be Uint8Array');
}
```

#### 2. 确保返回正确的属性
```typescript
// relayer-sdk 返回的格式：
// - handles[0]: 加密数据的句柄 (Uint8Array, 32字节)
// - inputProof: 零知识证明 (Uint8Array)
const dataToUse = encryptedInput.handles?.[0];
const proofToUse = encryptedInput.inputProof;
```

### 前端修复 (ContractService.ts)

#### 1. 严格的参数验证
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

### 合约修复 (PokerTable.sol)

#### 1. 简化 `_processBet` 函数
- 移除冗余的测试 `require` 语句
- 保留关键的验证检查
- 确保 `FHE.fromExternal` 调用正确

#### 2. 关键验证
```solidity
// 验证证明不为空 - 这是关键检查
require(inputProof.length > 0, "Invalid proof");

// 验证并转换加密金额
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
```

## 测试步骤

### 1. 本地测试
```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test
```

### 2. 前端测试
1. 连接钱包
2. 创建游戏桌
3. 加入游戏
4. 开始游戏
5. 尝试下注
6. 检查浏览器控制台日志

### 3. 调试日志
前端会输出详细的日志：
```
🔐 开始加密 uint64: { value, contractAddress, userAddress }
🔐 加密结果 - 完整对象: { keys, handles, inputProof, data, proof }
🔐 使用的数据: { dataType, dataLength, proofType, proofLength, ... }
📝 下注参数: { tableId, encryptedAmountType, inputProofType, ... }
📦 参数验证通过: { encryptedAmount, inputProof }
✅ 交易已发送: { hash }
✅ 下注成功，交易确认: { hash }
```

## 常见问题

### Q: 为什么 `encryptedAmount` 必须是 32 字节？
A: 因为 `externalEuint64` 在 Solidity 中被定义为 `bytes32` 类型，这是 FHEVM 的标准格式。

### Q: 为什么 `inputProof` 不能为空？
A: 因为 `FHE.fromExternal` 需要零知识证明来验证加密数据的有效性和完整性。

### Q: 如果仍然出现错误怎么办？
A: 检查以下几点：
1. FHEVM 实例是否正确初始化
2. 合约地址和用户地址是否正确
3. 加密数据是否正确生成
4. 网络连接是否正常

## 相关文件

- `/frontend/src/lib/fhevm.ts` - FHEVM 加密函数
- `/frontend/src/services/ContractService.ts` - 合约交互服务
- `/contracts/PokerTable.sol` - 智能合约
- `/frontend/src/pages/GameNew.tsx` - 游戏页面

## 参考资源

- [FHEVM 官方文档](https://docs.zama.ai/protocol/solidity-guides)
- [dev.md - FHEVM 快速开始](../dev.md)
- [relayer-sdk 文档](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

