# 快速测试指南 v3 - 使用 Buffer 修复

## 修复内容

已修改代码以使用 `Buffer` 而不是 `Uint8Array` 来传递加密数据给合约。

## 快速测试

### 步骤 1：清除缓存

```
1. 打开浏览器开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"
```

### 步骤 2：启动应用

```bash
cd fhe-poker/frontend
npm run dev
```

### 步骤 3：测试下注

1. 连接钱包（MetaMask）
2. 确保连接到 Sepolia 网络
3. 创建游戏桌
4. 加入游戏
5. 开始游戏
6. **尝试下注** ← 关键测试

### 步骤 4：验证修复

**浏览器控制台应显示：**

```
🔄 参数类型检查:
  - encryptedAmount 类型: Uint8Array 长度: 32
  - inputProof 类型: Uint8Array 长度: 100
🔄 转换后的参数:
  - encryptedAmountBuffer 类型: Buffer
  - inputProofBuffer 类型: Buffer
✅ 交易已发送: 0x...
✅ 下注成功，交易确认: 0x...
```

**不应出现：**
```
❌ 下注失败: 合约错误: 加密金额无效 (0x9de3392c)
```

## 成功标志

- ✅ 下注交易成功发送
- ✅ 交易已确认
- ✅ 游戏状态更新
- ✅ 没有 `0x9de3392c` 错误
- ✅ 参数类型为 `Buffer`

## 失败排查

### 仍然出现 0x9de3392c 错误

1. 清除浏览器缓存（完全清除）
2. 关闭浏览器，重新打开
3. 检查合约地址是否正确
4. 确保使用最新的前端代码

### 交易被拒绝

1. 检查钱包余额
2. 确保连接到 Sepolia 网络
3. 检查 gas 费用

### 看不到日志

1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 确保没有过滤日志

## 修改的文件

- `frontend/src/services/ContractService.ts`
- `frontend/src/lib/ethers-contract.ts`

## 关键改变

**之前（Uint8Array）：**
```typescript
const tx = await this.contract.bet(tableId, encryptedAmount, inputProof);
```

**现在（Buffer）：**
```typescript
const encryptedAmountBuffer = Buffer.from(encryptedAmount);
const inputProofBuffer = Buffer.from(inputProof);
const tx = await this.contract.bet(tableId, encryptedAmountBuffer, inputProofBuffer);
```

## 为什么使用 Buffer

- ethers.js 对 Buffer 有更好的支持
- Buffer 是处理二进制数据的标准方式
- 确保数据被正确编码为 `bytes32` 和 `bytes`

## 下一步

如果测试成功：
1. 测试其他游戏功能（fold、check、call）
2. 进行多玩家游戏测试
3. 测试游戏结束和奖励分配

如果测试失败：
1. 检查浏览器控制台的详细错误信息
2. 查看 `FIX_ATTEMPT_3_BUFFER.md` 了解更多技术细节
3. 检查合约是否已正确部署

