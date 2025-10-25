# Showdown 摊牌功能实现文档

## 📋 概述

本文档描述了德州扑克游戏中 Showdown (摊牌) 阶段的完整实现,包括牌型评估、比较和获胜者判定。

---

## 🎯 实现目标

1. ✅ 在 Showdown 阶段,玩家公开手牌
2. ✅ 自动评估所有玩家的最佳牌型
3. ✅ 比较牌型大小,决定获胜者
4. ✅ 分配奖池给获胜者
5. ✅ 结束游戏

---

## 🏗️ 架构设计

### 核心思路

由于 FHEVM 的加密特性,手牌在游戏过程中是加密的。在 Showdown 阶段:
1. 玩家在前端解密自己的手牌
2. 调用 `revealCards()` 提交明文手牌到合约
3. 合约验证并存储明文手牌
4. 当所有未弃牌玩家都公开手牌后,自动进行比牌
5. 决定获胜者并分配奖池

---

## 📊 数据结构修改

### Player 结构新增字段

```solidity
struct Player {
    // ... 原有字段 ...
    uint8 decryptedCard1;       // 解密后的手牌1 (Showdown阶段使用)
    uint8 decryptedCard2;       // 解密后的手牌2 (Showdown阶段使用)
    bool hasRevealedCards;      // 是否已公开手牌
}
```

---

## 🎴 牌型评估算法

### 支持的牌型 (从小到大)

1. **High Card** (高牌) - 没有任何组合
2. **One Pair** (一对) - 两张相同点数
3. **Two Pair** (两对) - 两个不同的对子
4. **Three of a Kind** (三条) - 三张相同点数
5. **Straight** (顺子) - 五张连续点数
6. **Flush** (同花) - 五张相同花色
7. **Full House** (葫芦) - 三条 + 一对
8. **Four of a Kind** (四条) - 四张相同点数
9. **Straight Flush** (同花顺) - 同花 + 顺子
10. **Royal Flush** (皇家同花顺) - 10-J-Q-K-A 同花顺

### 评估流程

```
1. 组合 7 张牌 (2 张手牌 + 5 张公共牌)
2. 遍历所有 C(7,5) = 21 种 5 张牌组合
3. 评估每种组合的牌型
4. 选择最佳牌型
```

### 核心函数

#### `_evaluateHand()`
- 输入: 2 张手牌 + 5 张公共牌
- 输出: 最佳牌型 + 牌型数值
- 逻辑: 遍历所有 21 种组合,选择最佳

#### `_evaluateFiveCards()`
- 输入: 5 张牌
- 输出: 牌型 + 数值
- 逻辑:
  1. 检查是否同花 (`_isFlush`)
  2. 检查是否顺子 (`_isStraight`)
  3. 统计点数重复次数
  4. 根据规则判断牌型

#### `_compareHands()`
- 输入: 两手牌的牌型和数值
- 输出: 哪手牌更大
- 逻辑:
  1. 先比较牌型等级
  2. 牌型相同则比较数值

---

## 🔄 游戏流程

### 1. PreFlop (翻牌前)
- 发放 2 张手牌(加密)
- 玩家进行第一轮下注

### 2. Flop (翻牌)
- 发放 3 张公共牌
- 第二轮下注

### 3. Turn (转牌)
- 发放第 4 张公共牌
- 第三轮下注

### 4. River (河牌)
- 发放第 5 张公共牌
- 第四轮下注

### 5. Showdown (摊牌)
- 玩家公开手牌
- 自动比牌
- 决定获胜者

### 6. Finished (结束)
- 分配奖池
- 游戏结束

---

## 🎮 前端实现

### 新增功能

1. **Showdown 阶段检测**
   - 当 `gameState === 5` 时,显示"摊牌阶段"提示

2. **公开手牌按钮**
   - 调用 `contractService.revealCards(tableId, card1, card2)`
   - 提交已解密的手牌到合约

3. **隐藏操作按钮**
   - Showdown 阶段隐藏"过牌"、"跟注"等按钮
   - 只显示"公开手牌"按钮

### ContractService 新增方法

```typescript
// 公开手牌
async revealCards(tableId: number, card1: number, card2: number): Promise<void>

// 检查是否已公开
async hasPlayerRevealedCards(tableId: number, playerIndex: number): Promise<boolean>

// 获取公开的手牌
async getRevealedCards(tableId: number, playerIndex: number): Promise<{ card1: number; card2: number }>
```

---

## 🧪 测试流程

### 准备工作

1. 部署新合约: `npm run deploy:sepolia`
2. 更新前端配置: `POKER_TABLE_ADDRESS`
3. 刷新浏览器,连接钱包

### 完整游戏测试

#### 步骤 1: 创建游戏
- 玩家 A 创建游戏桌
- 小盲注: 10, 大盲注: 20

#### 步骤 2: 加入游戏
- 玩家 A 加入游戏 (买入 1000)
- 玩家 B 加入游戏 (买入 1000)

#### 步骤 3: 开始游戏
- 玩家 A 点击"开始游戏"
- 状态变为"翻牌前"
- 双方收到 2 张手牌(加密)

#### 步骤 4: 解密手牌
- 前端自动解密手牌
- 显示明文手牌(如: 3♠ 10♣)

#### 步骤 5: PreFlop 下注
- 玩家 A 下注/过牌
- 玩家 B 下注/跟注
- 完成第一轮下注

#### 步骤 6: Flop
- 自动发放 3 张公共牌
- 显示公共牌(如: A♠ K♥ Q♦)
- 第二轮下注

#### 步骤 7: Turn
- 自动发放第 4 张公共牌
- 第三轮下注

#### 步骤 8: River
- 自动发放第 5 张公共牌
- 第四轮下注

#### 步骤 9: Showdown
- 状态变为"摊牌"
- 显示"公开手牌"按钮
- 玩家 A 点击"公开手牌"
- 玩家 B 点击"公开手牌"

#### 步骤 10: 自动比牌
- 合约自动评估双方牌型
- 比较牌型大小
- 决定获胜者
- 分配奖池
- 触发 `ShowdownComplete` 事件

#### 步骤 11: 游戏结束
- 状态变为"已结束"
- 获胜者收到奖池
- 显示获胜信息

---

## 📝 事件日志

### CardsRevealed
```solidity
event CardsRevealed(uint256 indexed tableId, address indexed player, uint8 card1, uint8 card2);
```
- 玩家公开手牌时触发

### ShowdownComplete
```solidity
event ShowdownComplete(uint256 indexed tableId, address indexed winner, uint8 winnerIndex, HandRank handRank);
```
- 比牌完成时触发
- 包含获胜者地址、索引和牌型

---

## ⚠️ 注意事项

### 1. 手牌验证
- 合约**不验证**提交的手牌是否与加密手牌一致
- 依赖玩家诚实提交
- 未来可以通过 ZK 证明来验证

### 2. 超时处理
- 当前版本没有超时机制
- 如果玩家不公开手牌,游戏会卡住
- 未来可以添加超时自动弃牌

### 3. Gas 消耗
- 牌型评估需要遍历 21 种组合
- Gas 消耗较高(约 350 万 gas)
- 已优化算法,确保在 gas limit 内

### 4. 平局处理
- 当前版本选择第一个最佳牌型的玩家
- 未来可以实现平分奖池

---

## 🚀 部署信息

- **合约地址**: `0xC0478d3267E6d6c1B70b6F2B8cDD2f36A6032682`
- **网络**: Sepolia 测试网
- **部署时间**: 2025-10-22
- **Gas 消耗**: 3,532,602

---

## 📚 相关文档

- [德州扑克规则](https://zh.wikipedia.org/wiki/德州撲克)
- [FHEVM 文档](https://docs.zama.ai/fhevm)
- [手牌解密实现](./HAND_DECRYPTION_IMPLEMENTATION.md)

---

## ✅ 实现清单

- [x] Player 结构添加明文手牌字段
- [x] 实现牌型评估算法
- [x] 实现牌型比较逻辑
- [x] 实现 Showdown 流程
- [x] 添加 `revealCards()` 函数
- [x] 添加查询函数
- [x] 前端 UI 实现
- [x] ContractService 集成
- [x] 合约编译和部署
- [x] 测试文档

---

## 🎉 总结

完整的 Showdown 功能已实现,包括:
1. ✅ 牌型评估 (10 种牌型)
2. ✅ 牌型比较
3. ✅ 自动决定获胜者
4. ✅ 奖池分配
5. ✅ 前端集成

现在可以进行完整的德州扑克游戏测试!

