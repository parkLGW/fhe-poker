# 🎮 FHE Poker 合约设计文档

## 1. 概述

FHE Poker 是一个基于全同态加密(FHE)的链上德州扑克游戏，通过FHEVM技术实现手牌完全隐私保护。

## 2. 核心设计理念

### 2.1 隐私保护
- **手牌加密**: 使用 `euint8` 类型存储每张牌(0-51)
- **余额加密**: 使用 `euint64` 类型存储玩家筹码
- **ACL控制**: 玩家只能访问自己的手牌
- **公共牌明文**: 公共牌对所有人可见,使用 `uint8` 存储

### 2.2 公平性保证
- **链上随机数**: 使用 `FHE.randEuint8()` 生成随机牌
- **防止作弊**: 手牌在发牌时即加密,无法提前知道
- **异步解密**: 摊牌时通过Oracle安全解密

## 3. 数据结构设计

### 3.1 扑克牌表示

```
牌值编码: 0-51
- 0-12:   黑桃 A,2,3,4,5,6,7,8,9,10,J,Q,K
- 13-25:  红心 A,2,3,4,5,6,7,8,9,10,J,Q,K
- 26-38:  方块 A,2,3,4,5,6,7,8,9,10,J,Q,K
- 39-51:  梅花 A,2,3,4,5,6,7,8,9,10,J,Q,K

花色提取: suit = cardValue / 13
点数提取: rank = cardValue % 13
```

### 3.2 玩家结构 (Player)

```solidity
struct Player {
    address addr;           // 玩家地址
    euint64 balance;        // 加密余额 ✅
    euint8 card1;           // 加密手牌1 ✅
    euint8 card2;           // 加密手牌2 ✅
    bool hasFolded;         // 是否弃牌
    bool isActive;          // 是否活跃
    euint64 currentBet;     // 当前下注 ✅
    euint64 totalBet;       // 总下注 ✅
    PlayerAction lastAction;// 最后动作
    uint256 lastActionTime; // 动作时间
}
```

### 3.3 游戏桌结构 (Table)

```solidity
struct Table {
    uint256 tableId;                    // 桌号
    GameState state;                    // 游戏状态
    Player[6] players;                  // 玩家数组
    uint8 playerCount;                  // 玩家数
    uint8 activePlayers;                // 活跃玩家数
    uint8[5] communityCards;            // 公共牌(明文)
    uint8 communityCardCount;           // 公共牌数量
    euint64 pot;                        // 奖池 ✅
    euint64 currentBet;                 // 当前最高注 ✅
    uint8 currentPlayerIndex;           // 当前玩家
    uint8 dealerIndex;                  // 庄家位置
    uint8 smallBlindIndex;              // 小盲位置
    uint8 bigBlindIndex;                // 大盲位置
    uint256 smallBlind;                 // 小盲金额
    uint256 bigBlind;                   // 大盲金额
    uint256 roundStartTime;             // 轮次开始时间
    uint256 lastDecryptRequestId;       // 解密请求ID
    bool isDecryptionPending;           // 等待解密
}
```

## 4. 状态机设计

### 4.1 游戏状态流转

```
Waiting (等待玩家)
    ↓ [玩家数 >= 2]
PreFlop (翻牌前)
    ↓ [发2张手牌 + 下注完成]
Flop (翻牌圈)
    ↓ [发3张公共牌 + 下注完成]
Turn (转牌圈)
    ↓ [发1张公共牌 + 下注完成]
River (河牌圈)
    ↓ [发1张公共牌 + 下注完成]
Showdown (摊牌)
    ↓ [请求解密 + 比牌]
Finished (结束)
    ↓ [分配奖池]
Waiting (等待下一局)
```

### 4.2 状态转换条件

| 当前状态 | 触发条件 | 下一状态 | 操作 |
|---------|---------|---------|------|
| Waiting | 玩家数 >= 2 且有人开始游戏 | PreFlop | 发手牌,收盲注 |
| PreFlop | 所有玩家完成下注 | Flop | 发3张公共牌 |
| Flop | 所有玩家完成下注 | Turn | 发1张公共牌 |
| Turn | 所有玩家完成下注 | River | 发1张公共牌 |
| River | 所有玩家完成下注 | Showdown | 请求解密 |
| Showdown | 解密完成 | Finished | 比牌,分配奖池 |
| Finished | 清理完成 | Waiting | 重置游戏桌 |

### 4.3 特殊情况处理

- **只剩一人**: 任何阶段如果只剩一个活跃玩家,直接进入Finished状态
- **超时**: 玩家超时未行动,自动Fold
- **全下(All-In)**: 玩家全下后自动跳过后续下注轮

## 5. 下注逻辑设计

### 5.1 玩家动作

```solidity
enum PlayerAction {
    None,   // 无动作
    Fold,   // 弃牌 - 退出本局
    Check,  // 过牌 - 当前无需跟注时可用
    Call,   // 跟注 - 跟上当前最高注
    Raise,  // 加注 - 提高下注金额
    AllIn   // 全下 - 下注所有筹码
}
```

### 5.2 下注规则

1. **盲注阶段** (PreFlop开始前):
   - 小盲位自动下小盲注
   - 大盲位自动下大盲注
   - 从大盲位下家开始行动

2. **下注轮次**:
   - 每轮从庄家下家开始(Flop/Turn/River)
   - 按顺时针方向轮流行动
   - 当所有玩家下注相等时,本轮结束

3. **动作限制**:
   - Fold: 任何时候可用
   - Check: 仅当 `currentBet == playerBet` 时可用
   - Call: 仅当 `currentBet > playerBet` 时可用
   - Raise: 必须至少是当前最高注的2倍
   - AllIn: 任何时候可用

### 5.3 奖池计算

```solidity
// 每次下注后更新奖池
pot = FHE.add(pot, betAmount);

// 边池处理(简化版本暂不实现)
// 当有玩家AllIn时,需要计算主池和边池
```

## 6. 发牌逻辑设计

### 6.1 随机数生成

```solidity
// 使用FHEVM的随机数生成
euint8 randomCard = FHE.randEuint8();

// 限制范围到0-51
euint8 card = FHE.rem(randomCard, 52);
```

### 6.2 防重复机制

```solidity
// 方案1: 使用已发牌标记数组
bool[52] dealtCards;

// 方案2: 重新生成直到不重复(gas消耗较高)
while (isDuplicate(card)) {
    card = FHE.randEuint8();
}
```

### 6.3 发牌流程

1. **PreFlop**: 给每位玩家发2张加密手牌
2. **Flop**: 发3张明文公共牌
3. **Turn**: 发1张明文公共牌
4. **River**: 发1张明文公共牌

### 6.4 ACL权限设置

```solidity
// 玩家手牌只允许玩家自己和合约访问
FHE.allowThis(player.card1);
FHE.allow(player.card1, player.addr);

FHE.allowThis(player.card2);
FHE.allow(player.card2, player.addr);
```

## 7. 比牌逻辑设计

### 7.1 牌型等级

```solidity
enum HandRank {
    HighCard,       // 0 - 高牌
    OnePair,        // 1 - 一对
    TwoPair,        // 2 - 两对
    ThreeOfKind,    // 3 - 三条
    Straight,       // 4 - 顺子
    Flush,          // 5 - 同花
    FullHouse,      // 6 - 葫芦
    FourOfKind,     // 7 - 四条
    StraightFlush,  // 8 - 同花顺
    RoyalFlush      // 9 - 皇家同花顺
}
```

### 7.2 牌型评估

```solidity
function evaluateHand(
    euint8 card1,
    euint8 card2,
    uint8[5] memory community
) internal returns (HandEvaluation memory) {
    // 1. 组合7张牌(2手牌 + 5公共牌)
    // 2. 检测牌型(从高到低)
    // 3. 返回牌型等级和踢脚牌
}
```

### 7.3 比牌流程

```solidity
// 1. 请求解密所有玩家手牌
function requestShowdown(uint256 tableId) external {
    bytes32[] memory cts = new bytes32[](activePlayers * 2);
    // 收集所有活跃玩家的手牌
    uint256 requestId = FHE.requestDecryption(cts, this.callbackShowdown.selector);
}

// 2. 解密回调
function callbackShowdown(
    uint256 requestId,
    bytes memory decrypted,
    bytes memory proof
) external {
    FHE.checkSignatures(requestId, decrypted, proof);
    // 解密手牌,评估牌型,确定获胜者
}
```

## 8. 安全考虑

### 8.1 防止信息泄露

- ✅ 手牌完全加密,玩家无法看到他人手牌
- ✅ 下注金额可选加密(增加策略性)
- ✅ 使用ACL严格控制访问权限

### 8.2 防止作弊

- ✅ 链上随机数,无法预测
- ✅ 发牌即加密,无法提前知道
- ✅ 解密需要KMS签名验证

### 8.3 防止重放攻击

- ✅ 使用requestId验证解密结果
- ✅ 每次解密后更新状态,防止重复使用

### 8.4 超时保护

- ✅ 设置行动超时时间(60秒)
- ✅ 超时自动Fold,防止拖延

## 9. Gas优化

### 9.1 数据结构优化

- 使用固定大小数组而非动态数组
- 合理使用 `uint8` 而非 `uint256`
- 批量处理减少存储操作

### 9.2 FHE操作优化

- 优先使用标量操作(scalar operands)
- 避免不必要的类型转换
- 合理使用 `FHE.select` 减少分支

### 9.3 HCU限制

- 单笔交易HCU限制: 20,000,000
- 深度限制: 5,000,000
- 需要合理拆分复杂操作

## 10. 未来扩展

### 10.1 MVP版本(当前)

- ✅ 2-6人德州扑克
- ✅ 基础下注操作
- ✅ 手牌加密
- ✅ 自动比牌结算

### 10.2 V2版本

- [ ] 多桌并行
- [ ] 边池(Side Pot)处理
- [ ] 旁观者模式
- [ ] 聊天功能

### 10.3 V3版本

- [ ] 锦标赛模式
- [ ] 排行榜系统
- [ ] NFT奖励
- [ ] DAO治理

---

**文档版本**: v1.0  
**最后更新**: 2025-10-20  
**作者**: FHE Poker Team
