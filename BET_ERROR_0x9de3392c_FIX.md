# 修复错误 0x9de3392c (InvalidEncryptedAmount)

## 问题描述

当玩家尝试下注时，合约返回错误 `0x9de3392c`，对应 `InvalidEncryptedAmount` 错误。这个错误发生在 `FHE.fromExternal()` 调用时，表示加密数据验证失败。

## 根本原因

**ethers.js 在处理 `Uint8Array` 参数时的类型转换问题**

当前端传递 `Uint8Array` 给合约函数时，ethers.js 需要将其转换为相应的 Solidity 类型：
- `bytes32` (externalEuint64) - 需要 64 字符的 hex 字符串
- `bytes` (inputProof) - 需要 hex 字符串

虽然 `Uint8Array` 在技术上是 `BytesLike` 的一部分，但在某些情况下 ethers.js 的自动转换可能不完全正确，导致合约端接收到格式不正确的数据。

## 解决方案

在前端调用合约函数前，**显式将 `Uint8Array` 转换为 hex 字符串**。

### 修改的文件和函数

#### 1. `frontend/src/lib/fhevm.ts`

**添加工具函数：**
```typescript
export function uint8ArrayToHex(data: Uint8Array): string {
  return '0x' + Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

#### 2. `frontend/src/services/ContractService.ts`

**修改 `bet()` 函数：**
- 导入 `uint8ArrayToHex` 函数
- 在调用合约前转换参数

**修改 `joinTable()` 函数：**
- 应用相同的转换逻辑

#### 3. `frontend/src/lib/ethers-contract.ts`

**修改 `callBet()` 函数：**
- 导入 `uint8ArrayToHex` 函数
- 在调用合约前转换参数

**修改 `callJoinTable()` 函数：**
- 应用相同的转换逻辑

## 技术细节

### 为什么需要显式转换？

1. **ethers.js v6 的行为**：虽然 ethers.js 支持 `BytesLike` 类型，但在某些情况下自动转换可能不够精确
2. **FHEVM 的严格要求**：FHEVM 的 `FHE.fromExternal()` 函数对输入数据格式有严格的要求
3. **数据完整性**：显式转换确保数据格式完全正确，避免任何潜在的转换错误

### 转换过程

```
Uint8Array [0x01, 0x02, 0x03, ...]
    ↓
Array.from() → [1, 2, 3, ...]
    ↓
map(b => b.toString(16).padStart(2, '0')) → ['01', '02', '03', ...]
    ↓
join('') → '010203...'
    ↓
'0x' + ... → '0x010203...'
```

## 修改总结

| 文件 | 函数 | 修改内容 |
|------|------|--------|
| `frontend/src/lib/fhevm.ts` | `uint8ArrayToHex()` | 新增工具函数 |
| `frontend/src/services/ContractService.ts` | `bet()` | 添加 hex 转换 |
| `frontend/src/services/ContractService.ts` | `joinTable()` | 添加 hex 转换 |
| `frontend/src/lib/ethers-contract.ts` | `callBet()` | 添加 hex 转换 |
| `frontend/src/lib/ethers-contract.ts` | `callJoinTable()` | 添加 hex 转换 |

## 测试步骤

1. **清除浏览器缓存**
   - 清除所有缓存和 cookies
   - 重新加载页面

2. **测试下注功能**
   - 创建新游戏桌
   - 加入游戏
   - 开始游戏
   - 尝试下注
   - 验证交易成功

3. **验证日志**
   - 检查浏览器控制台中的日志
   - 确认参数已正确转换为 hex 格式
   - 验证交易已发送和确认

## 预期结果

修复后，下注操作应该能够成功完成，不再出现 `0x9de3392c` 错误。

## 参考

- FHEVM 文档：https://docs.zama.ai/protocol/solidity-guides/
- ethers.js 文档：https://docs.ethers.org/v6/
- 错误代码 0x9de3392c：InvalidEncryptedAmount

