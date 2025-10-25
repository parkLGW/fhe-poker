# 下注功能测试指南

## 🎯 快速开始

### 前置条件
1. ✅ 合约已部署到 Sepolia 测试网
2. ✅ 前端配置已更新
3. ✅ 修复已应用

### 所需工具
- MetaMask 或其他 Web3 钱包
- Sepolia 测试网 ETH（用于 gas 费用）
- 现代浏览器（Chrome、Firefox、Safari 等）

---

## 📋 测试步骤

### 1. 启动前端开发服务器

```bash
cd /Users/liuguanwei/myprojects/zama/fhe-poker/frontend
npm run dev
```

**预期输出**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 2. 打开浏览器

访问: http://localhost:5173/

### 3. 连接钱包

1. 点击"连接钱包"按钮
2. 选择 MetaMask（或其他钱包）
3. 确保钱包连接到 **Sepolia 测试网**
4. 确认连接

**预期结果**:
- 钱包地址显示在页面上
- 网络显示为 "Sepolia"

### 4. 创建游戏桌

1. 点击"创建游戏桌"按钮
2. 输入小盲注和大盲注（例如：10 和 20）
3. 点击"创建"
4. 等待交易确认

**预期结果**:
- 交易被发送
- 交易被确认
- 游戏桌被创建

### 5. 加入游戏

1. 点击"加入游戏"按钮
2. 输入买入金额（例如：1000）
3. 点击"加入"
4. 等待交易确认

**预期结果**:
- 交易被发送
- 交易被确认
- 玩家加入游戏

### 6. 开始游戏

1. 点击"开始游戏"按钮
2. 等待交易确认

**预期结果**:
- 交易被发送
- 交易被确认
- 游戏开始

### 7. 测试下注功能 ⭐ 关键测试

1. 点击"加注"按钮
2. 输入下注金额（例如：100）
3. 点击"确认"
4. 等待交易确认

**预期结果**:
- ✅ 交易被发送
- ✅ 交易被确认
- ✅ 游戏状态更新
- ✅ **没有错误**

---

## 🔍 验证修复

### 检查浏览器控制台日志

打开浏览器开发者工具 (F12 或 Cmd+Option+I)，查看控制台日志：

#### 预期日志序列

```
🔐 开始加密 uint64: { value, contractAddress, userAddress }
🔐 加密结果 - 完整对象: { keys, handles, inputProof, data, proof }
🔐 使用的数据: { dataType, dataLength, proofType, proofLength, ... }
📝 下注参数: { tableId, encryptedAmountType, inputProofType, ... }
📦 参数验证通过: { encryptedAmount, inputProof }
✅ 交易已发送: { hash }
✅ 下注成功，交易确认: { hash }
```

#### 关键检查点

- [ ] `encryptedAmount` 是 `Uint8Array`
- [ ] `encryptedAmount` 长度是 32
- [ ] `inputProof` 是 `Uint8Array`
- [ ] `inputProof` 长度 > 0
- [ ] 没有 "Invalid" 错误
- [ ] 没有 "execution reverted" 错误

---

## ✅ 成功标志

### 下注功能正常工作的标志

1. ✅ 点击"加注"按钮后，没有错误弹出
2. ✅ 浏览器控制台没有错误信息
3. ✅ 交易被成功发送到区块链
4. ✅ 交易被确认
5. ✅ 游戏状态正确更新
6. ✅ 可以继续进行其他游戏操作

### 在区块浏览器上验证

访问: https://sepolia.etherscan.io/

搜索你的钱包地址，查看交易历史：
- 应该看到 "bet" 函数调用
- 交易状态应该是 "Success"

---

## 🐛 故障排查

### 错误 1: "Invalid encryptedAmount type"

**原因**: 加密数据不是 Uint8Array

**解决**:
1. 检查浏览器控制台日志
2. 查看 `encryptedAmount` 的类型
3. 检查 FHEVM 实例是否正确初始化

### 错误 2: "Invalid encryptedAmount length"

**原因**: 加密数据不是 32 字节

**解决**:
1. 检查 `encryptedAmount` 的长度
2. 应该是 32 字节
3. 检查 relayer-sdk 是否正确返回数据

### 错误 3: "inputProof cannot be empty"

**原因**: 证明为空

**解决**:
1. 检查 `inputProof` 是否为空
2. 检查 FHEVM 实例是否正确初始化
3. 检查网络连接

### 错误 4: "execution reverted (unknown custom error)"

**原因**: 合约验证失败

**解决**:
1. 检查所有参数是否正确
2. 查看浏览器控制台日志
3. 参考 [QUICK_BET_FIX_REFERENCE.md](./QUICK_BET_FIX_REFERENCE.md)

---

## 📊 测试检查清单

### 基本功能
- [ ] 钱包连接成功
- [ ] 网络是 Sepolia
- [ ] 创建游戏桌成功
- [ ] 加入游戏成功
- [ ] 开始游戏成功

### 下注功能 ⭐
- [ ] 点击"加注"按钮
- [ ] 输入下注金额
- [ ] 交易被发送
- [ ] 交易被确认
- [ ] 没有错误
- [ ] 游戏状态更新

### 日志验证
- [ ] 加密日志正确
- [ ] 参数验证日志正确
- [ ] 交易发送日志正确
- [ ] 交易确认日志正确

### 区块浏览器验证
- [ ] 交易在 Etherscan 上可见
- [ ] 交易状态是 "Success"
- [ ] 合约地址正确
- [ ] Gas 消耗合理

---

## 📞 获取帮助

### 查看文档
1. [BET_FIX_README.md](./BET_FIX_README.md) - 修复使用指南
2. [QUICK_BET_FIX_REFERENCE.md](./QUICK_BET_FIX_REFERENCE.md) - 快速参考
3. [DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md) - 部署报告

### 检查日志
- 打开浏览器开发者工具
- 查看控制台日志
- 查看网络请求

### 验证合约
- 合约地址: `0x76133C5619Fd9D1F5535aA18b4815561170eC912`
- 网络: Sepolia
- 区块浏览器: https://sepolia.etherscan.io/

---

## 🎉 测试完成

如果所有测试都通过，说明修复成功！

**下一步**: 
- 可以部署到生产环境
- 或继续进行更多测试

---

**测试指南**: ✅ **完成**
**修复验证**: 📋 **待测试**

