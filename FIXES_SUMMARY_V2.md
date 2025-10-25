# 🔧 修复总结 V2 - 加注和离开游戏错误

**修复日期**: 2025-10-21  
**状态**: ✅ 完成并部署  
**新合约地址**: `0x8978A2A1a96Fd8CEdBAA3bF9ecFaf88A3d12C1f9` (Sepolia)

---

## 🔴 问题1: 加注失败 - "hex_replace is not a function"

### 根本原因
前端发送的加密数据格式不对。`encryptBetAmount` 返回的 `data` 和 `proof` 是 `Uint8Array`，但直接传递给 wagmi 时没有转换为 hex 字符串。

### 修复方案 ✅

**文件**: `frontend/src/pages/Game.tsx` (第 282-364 行)

```typescript
// 修复前: 直接传递 Uint8Array
args: [BigInt(tableId), encrypted.data, encrypted.proof]

// 修复后: 转换为 hex 字符串
const dataHex = ('0x' + Array.from(encrypted.data).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
const proofHex = ('0x' + Array.from(encrypted.proof).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
args: [BigInt(tableId), dataHex, proofHex]
```

这与 `Lobby.tsx` 中的 `joinTable` 实现保持一致。

---

## 🔴 问题2: 离开游戏失败 - "0x9de3392c"

### 根本原因
`leaveTable` 函数中的 `activePlayers` 计数逻辑有问题：

1. **下溢风险**: 无条件地减少 `activePlayers`，可能导致下溢
2. **重复计数**: 游戏进行中离开时，如果玩家已经弃牌，`activePlayers` 会被减少两次
3. **状态不一致**: 游戏等待状态时，没有检查玩家是否真的是活跃的

### 修复方案 ✅

**文件**: `frontend/src/contracts/PokerTable.sol` (第 299-363 行)

```solidity
// 修复前: 无条件减少
table.activePlayers--;

// 修复后: 添加检查
if (table.activePlayers > 0) {
    table.activePlayers--;
}

// 游戏等待状态: 检查玩家是否活跃
if (player.isActive && table.activePlayers > 0) {
    table.activePlayers--;
}
```

### 额外修复: _endGame 函数

**文件**: `frontend/src/contracts/PokerTable.sol` (第 944-983 行)

修复了 `StateChanged` 事件中的状态参数：

```solidity
// 修复前: 使用已更新的状态
emit StateChanged(tableId, table.state, GameState.Finished);

// 修复后: 保存之前的状态
GameState previousState = table.state;
// ... 更新状态 ...
emit StateChanged(tableId, previousState, GameState.Finished);
```

---

## 📊 修复统计

| 问题 | 文件 | 修复 | 状态 |
|------|------|------|------|
| 加注失败 | Game.tsx | 转换 Uint8Array 为 hex | ✅ |
| 离开游戏失败 | PokerTable.sol | 修复 activePlayers 计数 | ✅ |
| 事件参数错误 | PokerTable.sol | 保存之前的游戏状态 | ✅ |

---

## 🚀 部署信息

### 编译
```
✅ 编译成功
- 0 个错误
- 2 个警告 (未使用的参数)
```

### 部署
```
✅ 部署到 Sepolia
- 交易: 0x4f1faeb839cdf2630f752fe0444b822ad1d53f3ec129045a839461ac0f0f301b
- 地址: 0x8978A2A1a96Fd8CEdBAA3bF9ecFaf88A3d12C1f9
- Gas: 2,471,042
```

### 前端更新
```
✅ 已更新
- 文件: frontend/src/lib/contract.ts
- 新地址: 0x8978A2A1a96Fd8CEdBAA3bF9ecFaf88A3d12C1f9
```

---

## ✅ 验证清单

- [x] 合约编译成功
- [x] 合约部署到 Sepolia
- [x] 前端配置已更新
- [x] 加注逻辑已修复
- [x] 离开游戏逻辑已修复
- [x] 事件参数已修复

---

## 🧪 建议的测试

1. **测试加注功能**
   - 进入游戏
   - 点击"加注"按钮
   - 输入有效金额
   - 验证交易成功

2. **测试离开游戏**
   - 在 Waiting 状态离开
   - 在游戏进行中离开
   - 验证返回游戏大厅

3. **边界测试**
   - 快速连续加注
   - 游戏中弃牌后离开
   - 最后一个玩家离开


