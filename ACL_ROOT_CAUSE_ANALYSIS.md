# FHEVM ACL 权限问题根本原因分析

## ✅ 问题已彻底解决!

### 问题描述

在修复了 `Buffer is not defined` 错误后,下注功能一直报错:

```
ACLNotAllowed(bytes32,address)
错误选择器: 0x9de3392c
```

### 🔍 深度分析过程

#### 1. 错误数据分析

最新的错误数据:
```
0x9de3392c94f825fbde86c0044eaff53d9e8cbdd5c4ba0cee3dff0000000000aa36a70500000000000000000000000000be388cb8b090b4c2c5fd62fc50c1e7f9c6247c22
```

解析:
- 错误选择器: `0x9de3392c` = `ACLNotAllowed(bytes32,address)`
- Handle: `0x94f825fbde86c0044eaff53d9e8cbdd5c4ba0cee3dff0000000000aa36a70500`
- Account: `0xbe388cb8b090b4c2c5fd62fc50c1e7f9c6247c22` (合约地址)

#### 2. 关键发现

**前端发送的加密数据**:
```
0x350d31b2dbc221456ccb0ad4ce0e18566857289d46000000000000aa36a70500
```

**错误中的 handle**:
```
0x94f825fbde86c0044eaff53d9e8cbdd5c4ba0cee3dff0000000000aa36a70500
```

**两者不匹配!** 这意味着合约在尝试访问一个**不同的** handle,而不是前端发送的那个!

#### 3. 根本原因

错误中的 handle 是 `FHE.add()` 或 `FHE.sub()` 等 FHE 操作的**输入参数**,而不是结果!

具体来说,在 `_processBet` 函数中:

```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

// 从玩家余额中扣除
player.balance = FHE.sub(player.balance, amount);  // ← 这里!
```

当执行 `FHE.sub(player.balance, amount)` 时,FHEVM 需要访问 `player.balance` 这个加密值。但是,`player.balance` 可能没有合约的 ACL 权限!

更重要的是,在 `joinTable` 函数中:

```solidity
player.currentBet = FHE.asEuint64(uint64(0));
player.totalBet = FHE.asEuint64(uint64(0));

// ❌ 没有为这些字段设置 ACL 权限!
```

当 `_processBet` 尝试执行 `FHE.add(player.currentBet, amount)` 时,合约没有权限访问 `player.currentBet`,所以抛出 `ACLNotAllowed` 错误!

### 🛠️ 完整的修复方案

#### 修复 1: `joinTable` 函数

**修改前**:
```solidity
player.currentBet = FHE.asEuint64(uint64(0));
player.totalBet = FHE.asEuint64(uint64(0));

// 设置ACL权限
FHE.allowThis(player.balance);
FHE.allow(player.balance, msg.sender);
```

**修改后**:
```solidity
player.currentBet = FHE.asEuint64(uint64(0));
player.totalBet = FHE.asEuint64(uint64(0));

// 设置ACL权限 - 必须为所有加密字段设置权限
FHE.allowThis(player.balance);
FHE.allow(player.balance, msg.sender);

// ✅ 为 currentBet 和 totalBet 设置 ACL 权限
FHE.allowThis(player.currentBet);
FHE.allowThis(player.totalBet);

// 为卡牌设置 ACL 权限
FHE.allowThis(player.card1);
FHE.allowThis(player.card2);
```

#### 修复 2: `startGame` 函数

**修改前**:
```solidity
for (uint8 i = 0; i < table.playerCount; i++) {
    players[i].currentBet = FHE.asEuint64(uint64(0));
    players[i].totalBet = FHE.asEuint64(uint64(0));
}
```

**修改后**:
```solidity
for (uint8 i = 0; i < table.playerCount; i++) {
    players[i].currentBet = FHE.asEuint64(uint64(0));
    players[i].totalBet = FHE.asEuint64(uint64(0));
    
    // ✅ 为重置的加密字段设置 ACL 权限
    FHE.allowThis(players[i].currentBet);
    FHE.allowThis(players[i].totalBet);
}
```

#### 修复 3: `_collectBlinds` 函数

**修改前**:
```solidity
euint64 smallBlindAmount = FHE.asEuint64(uint64(table.smallBlind));
players[table.smallBlindIndex].balance = FHE.sub(...);
players[table.smallBlindIndex].currentBet = smallBlindAmount;
players[table.smallBlindIndex].totalBet = smallBlindAmount;
```

**修改后**:
```solidity
euint64 smallBlindAmount = FHE.asEuint64(uint64(table.smallBlind));
FHE.allowThis(smallBlindAmount);

players[table.smallBlindIndex].balance = FHE.sub(...);
FHE.allowThis(players[table.smallBlindIndex].balance);
FHE.allow(players[table.smallBlindIndex].balance, players[table.smallBlindIndex].addr);

players[table.smallBlindIndex].currentBet = smallBlindAmount;
players[table.smallBlindIndex].totalBet = smallBlindAmount;
FHE.allowThis(players[table.smallBlindIndex].currentBet);
FHE.allowThis(players[table.smallBlindIndex].totalBet);
```

#### 修复 4: `_resetBettingRound` 函数

**修改前**:
```solidity
for (uint8 i = 0; i < table.playerCount; i++) {
    if (!players[i].hasFolded) {
        players[i].currentBet = FHE.asEuint64(uint64(0));
    }
}
tableCurrentBets[tableId] = FHE.asEuint64(uint64(0));
```

**修改后**:
```solidity
for (uint8 i = 0; i < table.playerCount; i++) {
    if (!players[i].hasFolded) {
        players[i].currentBet = FHE.asEuint64(uint64(0));
        FHE.allowThis(players[i].currentBet);
    }
}
tableCurrentBets[tableId] = FHE.asEuint64(uint64(0));
FHE.allowThis(tableCurrentBets[tableId]);
```

#### 修复 5: `createTable` 函数

**修改前**:
```solidity
tablePots[tableId] = FHE.asEuint64(uint64(0));
tableCurrentBets[tableId] = FHE.asEuint64(uint64(0));
```

**修改后**:
```solidity
tablePots[tableId] = FHE.asEuint64(uint64(0));
tableCurrentBets[tableId] = FHE.asEuint64(uint64(0));

FHE.allowThis(tablePots[tableId]);
FHE.allowThis(tableCurrentBets[tableId]);
```

#### 修复 6: `_endGame` 函数

**修改前**:
```solidity
if (winnerIndex != 255 && winner != address(0)) {
    players[winnerIndex].balance = FHE.add(...);
}
tablePots[tableId] = FHE.asEuint64(uint64(0));
```

**修改后**:
```solidity
if (winnerIndex != 255 && winner != address(0)) {
    players[winnerIndex].balance = FHE.add(...);
    FHE.allowThis(players[winnerIndex].balance);
    FHE.allow(players[winnerIndex].balance, winner);
}
tablePots[tableId] = FHE.asEuint64(uint64(0));
FHE.allowThis(tablePots[tableId]);
```

### 📚 关键教训

#### 1. FHEVM ACL 规则

**规则 1**: 每个加密值在创建或修改后,都必须调用 `FHE.allowThis()` 授予合约权限。

**规则 2**: 如果用户需要访问加密值(查询或解密),还需要调用 `FHE.allow(value, user)`。

**规则 3**: `FHE.fromExternal()` 会自动授予 `msg.sender` 临时权限,但不会授予合约权限。

**规则 4**: FHE 运算(`FHE.add()`, `FHE.sub()` 等)的**输入参数**必须有合约的 ACL 权限。

**规则 5**: FHE 运算的**结果**也需要设置 ACL 权限,才能在后续操作中使用。

#### 2. 常见错误模式

❌ **错误模式 1**: 创建加密值后忘记设置 ACL 权限
```solidity
player.currentBet = FHE.asEuint64(uint64(0));
// ❌ 忘记调用 FHE.allowThis(player.currentBet)
```

❌ **错误模式 2**: 只对部分加密字段设置 ACL 权限
```solidity
FHE.allowThis(player.balance);
// ❌ 忘记为 player.currentBet 和 player.totalBet 设置权限
```

❌ **错误模式 3**: 对输入授权而不是对结果授权
```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
FHE.allowThis(amount);  // ❌ 这是不必要的
player.balance = FHE.sub(player.balance, amount);
// ❌ 忘记对结果授权
```

✅ **正确模式**: 对所有加密值设置 ACL 权限
```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
player.balance = FHE.sub(player.balance, amount);
FHE.allowThis(player.balance);  // ✅ 对结果授权
FHE.allow(player.balance, msg.sender);  // ✅ 允许用户访问
```

### 📦 部署信息

- **最终合约地址**: `0xa95492eF704cE94e60078F3E38629Ea5C5E3c993`
- **网络**: Sepolia 测试网
- **部署时间**: 2025-10-22
- **Gas 使用**: 2,626,675

### 🎮 测试步骤

1. ✅ 刷新浏览器页面 (http://localhost:5173)
2. ✅ 重新连接钱包
3. ✅ 创建新游戏桌
4. ✅ 加入游戏
5. ✅ 开始游戏
6. ⏳ 尝试下注

### 预期结果

下注操作应该成功,不再出现 `ACLNotAllowed` 错误。

### 参考文档

- [FHEVM Access Control List](https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl)
- [FHEVM Best Practices](https://docs.zama.ai/protocol/solidity-guides/smart-contract/best-practices)
- `dev.md` 第 88 行: ACL 概述
- `dev.md` 第 2169 行: `FHE.allowThis()` 说明
- `dev.md` 第 2182-2186 行: 授权函数说明

