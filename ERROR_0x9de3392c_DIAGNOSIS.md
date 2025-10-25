# 错误诊断: 0x9de3392c

## 问题描述

加注和离开游戏都返回错误 `0x9de3392c`，且这个错误签名不在 ABI 中。

## 根本原因分析

### 1. 错误来源

错误 `0x9de3392c` **不是** 来自我们的合约定义的错误。这个错误很可能来自：

- **FHEVM 库内部错误** - `FHE.fromExternal()` 验证失败
- **Solidity 内部错误** - 某个 require 语句失败
- **EVM 级别的错误** - 如 revert 或 panic

### 2. 已排除的可能性

我们已经验证了以下错误签名：

```
Error(string)        => 0x08c379a0  ❌ 不匹配
Panic(uint256)       => 0x4e487b71  ❌ 不匹配
NotInGame()          => 0x43050d96  ❌ 不匹配
InvalidState()       => 0xbaf3f0f7  ❌ 不匹配
InvalidBetAmount()   => 0x9de3d441  ❌ 不匹配
NotYourTurn()        => 0xe60c8f58  ❌ 不匹配
```

### 3. 最可能的原因

根据错误发生的位置（`_processBet` 函数中的 `FHE.fromExternal()` 调用），最可能的原因是：

**FHEVM 库的 `FHE.fromExternal()` 函数验证失败**

这个函数验证：
1. 加密数据的格式是否正确
2. 证明（proof）是否有效
3. 加密数据是否绑定到正确的合约和用户

## 解决方案

### 方案 1: 检查前端加密数据格式

确保前端发送的加密数据格式正确：

```typescript
// Game.tsx 中的 handleBet 函数
const encrypted = await fhevm.encryptBetAmount(amount);

// 验证数据格式
console.log('加密数据:', {
  dataType: encrypted.data.constructor.name,
  dataLength: encrypted.data.length,
  proofType: encrypted.proof.constructor.name,
  proofLength: encrypted.proof.length,
});

// 转换为 hex 字符串
const dataHex = ('0x' + Array.from(encrypted.data)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('')) as `0x${string}`;
const proofHex = ('0x' + Array.from(encrypted.proof)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('')) as `0x${string}`;

console.log('Hex 格式:', { dataHex, proofHex });
```

### 方案 2: 验证玩家状态

在调用 `bet` 或 `leaveTable` 前，验证玩家确实在游戏中：

```typescript
// 检查玩家是否在游戏中
const playerTableId = await publicClient.readContract({
  address: POKER_TABLE_ADDRESS,
  abi: POKER_TABLE_ABI,
  functionName: 'playerTable',
  args: [address],
});

console.log('玩家所在桌号:', playerTableId);
console.log('当前桌号:', tableId);
console.log('玩家在游戏中:', Number(playerTableId) === tableId + 1);
```

### 方案 3: 添加调试日志

在合约中添加事件来追踪执行流程：

```solidity
event DebugBet(
    uint256 indexed tableId,
    address indexed player,
    bytes encryptedAmount,
    bytes inputProof
);

function _processBet(...) internal {
    emit DebugBet(tableId, msg.sender, encryptedAmount, inputProof);
    // ... rest of function
}
```

## 测试步骤

1. **检查加密数据**
   - 在浏览器控制台中查看加密数据的格式
   - 确保 `data` 和 `proof` 都是 `Uint8Array`

2. **验证玩家状态**
   - 确认玩家已成功加入游戏
   - 检查 `playerTable` 映射中的值

3. **查看交易详情**
   - 在 Etherscan 上查看失败的交易
   - 查看 "Revert Reason" 部分

4. **启用调试模式**
   - 添加 `console.log` 语句到前端
   - 添加事件到合约

## 相关文件

- `frontend/src/pages/Game.tsx` - 加注逻辑
- `frontend/src/lib/fhevm.ts` - FHEVM 加密函数
- `contracts/PokerTable.sol` - 合约逻辑
- `frontend/src/lib/contract.ts` - ABI 配置

## 下一步

1. 运行诊断脚本检查加密数据格式
2. 验证玩家确实在游戏中
3. 查看 Etherscan 上的交易详情
4. 如果问题仍然存在，收集更多调试信息


