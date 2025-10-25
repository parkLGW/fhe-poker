# 🔍 调试指南 - 错误 0x9de3392c

## 问题描述

加注和离开游戏都返回错误 `0x9de3392c`，但这个错误签名在 ABI 中找不到。

## 错误分析

### 已排除的可能性

1. ✅ 所有自定义错误都已添加到 ABI 中
2. ✅ 错误签名已验证（NotInGame = 0x43050d96, InvalidState = 0xbaf3f0f7 等）
3. ✅ 前端数据格式正确（Uint8Array 已转换为 hex）

### 可能的原因

1. **FHEVM 库错误** - 错误可能来自 FHEVM 库本身
2. **合约编译问题** - 新编译的合约可能有不同的错误定义
3. **数据验证失败** - `FHE.fromExternal()` 可能失败
4. **玩家状态问题** - 玩家可能不在游戏中或游戏状态不对

## 调试步骤

### 1. 检查玩家状态

在前端添加日志来检查玩家是否真的在游戏中：

```typescript
// 在 handleBet 之前添加
const tableInfo = await publicClient.readContract({
  address: POKER_TABLE_ADDRESS,
  abi: POKER_TABLE_ABI,
  functionName: 'getTableInfo',
  args: [BigInt(tableId)],
});

const playerIndex = await publicClient.readContract({
  address: POKER_TABLE_ADDRESS,
  abi: POKER_TABLE_ABI,
  functionName: 'getPlayerIndex',
  args: [BigInt(tableId), address],
});

console.log('表格信息:', tableInfo);
console.log('玩家索引:', playerIndex);
```

### 2. 检查 playerTable 映射

```typescript
const playerTableValue = await publicClient.readContract({
  address: POKER_TABLE_ADDRESS,
  abi: POKER_TABLE_ABI,
  functionName: 'playerTable',
  args: [address],
});

console.log('playerTable[msg.sender]:', playerTableValue);
console.log('期望值:', BigInt(tableId) + BigInt(1));
```

### 3. 检查游戏状态

```typescript
const tableInfo = await publicClient.readContract({
  address: POKER_TABLE_ADDRESS,
  abi: POKER_TABLE_ABI,
  functionName: 'getTableInfo',
  args: [BigInt(tableId)],
});

console.log('游戏状态:', tableInfo.state);
console.log('当前玩家索引:', tableInfo.currentPlayerIndex);
console.log('玩家数量:', tableInfo.playerCount);
console.log('活跃玩家数:', tableInfo.activePlayers);
```

### 4. 验证加密数据

```typescript
const encrypted = await fhevm.encryptBetAmount(amount);
console.log('加密数据长度:', encrypted.data.length);
console.log('加密证明长度:', encrypted.proof.length);
console.log('加密数据 (hex):', '0x' + Array.from(encrypted.data).map(b => b.toString(16).padStart(2, '0')).join(''));
```

## 解决方案

### 方案 1: 添加更详细的错误处理

在合约中添加 `require` 语句来提供更详细的错误信息：

```solidity
function bet(
    uint256 tableId,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) external inGame(tableId) isPlayerTurn(tableId) {
    require(tableId < tableCount, "Table not found");
    require(playerTable[msg.sender] == tableId + 1, "Not in game");
    
    Table storage table = tables[tableId];
    require(table.state != GameState.Waiting, "Game not started");
    
    _processBet(tableId, encryptedAmount, inputProof);
    _handleRaise(tableId);
}
```

### 方案 2: 检查 FHEVM 库版本

确保使用的 FHEVM 库版本与合约兼容。

### 方案 3: 重新部署合约

如果上述方案都不起作用，尝试重新编译和部署合约：

```bash
npm run compile
npx hardhat deploy --network sepolia
```

## 测试清单

- [ ] 检查玩家是否真的在游戏中
- [ ] 检查 playerTable 映射是否正确
- [ ] 检查游戏状态是否正确
- [ ] 检查加密数据格式是否正确
- [ ] 检查 FHEVM 库版本
- [ ] 重新部署合约


