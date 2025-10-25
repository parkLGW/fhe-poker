# 🔧 故障排除指南

**日期**: 2025-10-21  
**问题**: 加注和离开游戏返回错误 `0x9de3392c`

---

## 问题描述

### 症状
```
❌ 加注失败: The contract function "bet" reverted with the following signature:
0x9de3392c

Unable to decode signature "0x9de3392c" as it was not found on the provided ABI.
```

### 影响范围
- ❌ 加注功能不可用
- ❌ 离开游戏功能不可用
- ✅ 其他功能正常

---

## 快速诊断

### 步骤 1: 打开浏览器控制台

1. 按 `F12` 打开开发者工具
2. 点击 "Console" 标签
3. 尝试加注

### 步骤 2: 查看诊断信息

在控制台中查找以下信息：

```javascript
📊 诊断信息: {
  playerTableId: 1,
  expectedTableId: 1,
  isPlayerInGame: true,
  currentTableId: 0
}
```

**检查清单**:
- [ ] `playerTableId` 等于 `expectedTableId`
- [ ] `isPlayerInGame` 是 `true`
- [ ] `currentTableId` 是正确的

### 步骤 3: 检查加密数据

查找以下日志：

```javascript
📞 调用合约 bet 函数: {
  address: "0x472351627269F61EdC13B550400A47921ed8510D",
  functionName: "bet",
  args: [0, "0x...", "0x..."],
  dataHexLen: 66,
  proofHexLen: 258
}
```

**检查清单**:
- [ ] `dataHexLen` 是 66
- [ ] `proofHexLen` 是合理的长度（通常 200-300）
- [ ] 两个 hex 字符串都以 `0x` 开头

---

## 常见问题

### Q1: 玩家不在游戏中

**症状**: `isPlayerInGame: false`

**解决方案**:
1. 确认已成功加入游戏
2. 检查 `playerTable` 映射
3. 尝试重新加入游戏

### Q2: 加密数据格式错误

**症状**: `dataHexLen` 不是 66

**解决方案**:
1. 检查 FHEVM 初始化
2. 验证加密函数返回值
3. 查看 `fhevm.ts` 中的加密逻辑

### Q3: 证明无效

**症状**: 加密数据正确，但仍然失败

**解决方案**:
1. 确保证明与加密数据匹配
2. 检查合约地址是否正确
3. 验证用户地址是否正确

---

## 高级诊断

### 查看 Etherscan 交易

1. 访问 https://sepolia.etherscan.io/
2. 搜索合约地址: `0x472351627269F61EdC13B550400A47921ed8510D`
3. 查看最近的交易
4. 点击失败的交易
5. 查看 "Revert Reason" 部分

### 启用详细日志

在 `Game.tsx` 中添加：

```typescript
console.log('完整的加密数据:', {
  data: encrypted.data,
  proof: encrypted.proof,
  dataHex: dataHex,
  proofHex: proofHex,
});
```

### 测试加密函数

在浏览器控制台中运行：

```javascript
// 测试加密
const fhevm = window.fhevm; // 如果暴露了
const encrypted = await fhevm.encryptBetAmount(100);
console.log('加密结果:', encrypted);
```

---

## 解决方案

### 方案 A: 重新部署合约

```bash
cd fhe-poker
npm run compile
npx hardhat deploy --network sepolia
```

然后更新前端配置中的合约地址。

### 方案 B: 检查 FHEVM 初始化

确保 FHEVM 正确初始化：

```typescript
// 在 useFHEVM.ts 中
if (!fhevm.isInitialized) {
  console.error('FHEVM 未初始化');
  return;
}
```

### 方案 C: 验证玩家状态

在调用 `bet` 前验证：

```typescript
const playerTableId = await publicClient.readContract({
  address: POKER_TABLE_ADDRESS,
  abi: POKER_TABLE_ABI,
  functionName: 'playerTable',
  args: [address],
});

if (Number(playerTableId) !== tableId + 1) {
  console.error('玩家不在游戏中');
  return;
}
```

---

## 联系支持

如果问题仍未解决，请提供：

1. **完整的错误信息** - 从浏览器控制台复制
2. **诊断信息** - 上面的 `📊 诊断信息` 输出
3. **交易哈希** - 从 Etherscan 获取
4. **合约地址** - 当前使用的合约地址
5. **网络信息** - 确认使用的是 Sepolia

---

## 相关文件

- `ERROR_0x9de3392c_DIAGNOSIS.md` - 详细的错误分析
- `frontend/src/pages/Game.tsx` - 加注逻辑
- `contracts/PokerTable.sol` - 合约代码
- `frontend/src/lib/fhevm.ts` - FHEVM 加密函数


