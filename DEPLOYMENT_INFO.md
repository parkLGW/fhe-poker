# 🚀 合约部署信息

**部署时间**: 2025-10-20 16:22  
**网络**: Sepolia 测试网  
**部署者**: 0x1e7F5879150973332987dd6d122C3292243e75e4

---

## 📍 已部署合约

### PokerTable 主合约

**合约地址**: `0xe177a6106e7313E4655B94AcFBc8c37C121db10f`

**部署交易**: `0x03c7d06b768a9c2607d55ffe2864f48a4935a6633a2ae2881ebeaf18c5a85d75`

**Gas 使用**: 2,667,112

**区块浏览器**:
- Etherscan: https://sepolia.etherscan.io/address/0xe177a6106e7313E4655B94AcFBc8c37C121db10f
- 交易详情: https://sepolia.etherscan.io/tx/0x03c7d06b768a9c2607d55ffe2864f48a4935a6633a2ae2881ebeaf18c5a85d75

---

## 🔧 前端配置

已更新 `frontend/src/lib/contract.ts`:
```typescript
export const POKER_TABLE_ADDRESS = '0xe177a6106e7313E4655B94AcFBc8c37C121db10f';
```

---

## 🌐 网络配置

**网络名称**: Sepolia  
**Chain ID**: 11155111  
**RPC URL**: https://ethereum-sepolia-rpc.publicnode.com  
**区块浏览器**: https://sepolia.etherscan.io

---

## 💰 合约功能

### 可用功能
1. ✅ `createTable(smallBlind, bigBlind)` - 创建游戏桌
2. ✅ `joinTable(tableId, encryptedBuyIn, inputProof)` - 加入游戏
3. ✅ `leaveTable(tableId)` - 离开游戏
4. ✅ `fold(tableId)` - 弃牌
5. ✅ `check(tableId)` - 过牌
6. ✅ `call(tableId)` - 跟注
7. ✅ `bet(tableId, encryptedAmount, inputProof)` - 下注/加注
8. ✅ `getTableInfo(tableId)` - 获取游戏桌信息
9. ✅ `getCommunityCards(tableId)` - 获取公共牌

---

## 🧪 测试步骤

### 1. 连接钱包
- 打开前端: http://localhost:5173
- 连接MetaMask
- 切换到Sepolia测试网

### 2. 创建游戏桌
- 点击"创建游戏桌"
- 设置小盲注和大盲注
- 点击"确认创建"
- 等待交易确认

### 3. 加入游戏
- 在游戏大厅看到新创建的游戏桌
- 点击"加入游戏"
- 输入买入金额
- 确认交易

### 4. 开始游戏
- 等待其他玩家加入
- 游戏自动开始
- 进行下注操作

---

## ⚠️ 注意事项

1. **需要Sepolia ETH**
   - 获取测试币: https://sepoliafaucet.com
   - 或: https://www.alchemy.com/faucets/ethereum-sepolia

2. **Gas费用**
   - 创建游戏桌: ~0.01 ETH
   - 加入游戏: ~0.005 ETH
   - 每次操作: ~0.001-0.003 ETH

3. **FHEVM限制**
   - 当前使用简化版FHEVM
   - 加密功能已实现
   - 解密需要网关集成

4. **网络延迟**
   - Sepolia测试网可能较慢
   - 交易确认需要15-30秒
   - 请耐心等待

---

## 🔍 验证合约

如果需要验证合约源码:

```bash
npx hardhat verify --network sepolia 0xe177a6106e7313E4655B94AcFBc8c37C121db10f
```

---

## 📊 合约统计

| 指标 | 数值 |
|------|------|
| 合约大小 | ~10KB |
| 部署Gas | 2,667,112 |
| 函数数量 | 15+ |
| 状态变量 | 10+ |

---

## 🎮 下一步

### 立即可做
1. ✅ 刷新前端页面
2. ✅ 连接Sepolia网络
3. ✅ 测试创建游戏桌
4. ✅ 测试加入游戏

### 待完善
1. ⏳ 集成FHEVM网关
2. ⏳ 实现解密功能
3. ⏳ 完善错误处理
4. ⏳ 添加事件监听

---

## 🐛 已知问题

1. **FHEVM配置**
   - 类型定义不完整
   - 需要网关配置
   - 解密未实现

2. **UI问题**
   - 使用模拟玩家数据
   - 需要实时更新
   - 加载状态待完善

---

## 📝 更新日志

### 2025-10-20 16:22
- ✅ 部署PokerTable到Sepolia
- ✅ 更新前端合约地址
- ✅ 配置公共RPC节点
- ✅ 创建部署文档

---

**状态**: 🟢 合约已部署，可以测试  
**建议**: 立即测试创建游戏桌功能

---

**部署者**: 0x1e7F5879150973332987dd6d122C3292243e75e4  
**合约地址**: 0xe177a6106e7313E4655B94AcFBc8c37C121db10f  
**网络**: Sepolia (Chain ID: 11155111)
