# 下注功能修复 - 使用指南

## 🎯 快速开始

如果你遇到了下注功能的错误，请按以下步骤操作：

### 1. 了解问题
```
Error: execution reverted (unknown custom error)
Error data: 0x9de3392c
```

### 2. 查看修复
所有修复已经应用到代码中，包括：
- ✅ 前端加密函数修复
- ✅ 合约交互服务修复
- ✅ 智能合约修复

### 3. 验证修复
```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test test/BetFunctionTest.ts
```

### 4. 部署修复
```bash
# 部署到测试网络
npx hardhat run deploy/deployPokerTable.ts --network sepolia
```

---

## 📚 文档导航

### 快速参考
- **[QUICK_BET_FIX_REFERENCE.md](./QUICK_BET_FIX_REFERENCE.md)** ⭐ 推荐首先阅读
  - 快速了解修复内容
  - 常见错误和解决方案
  - 数据流程图

### 详细指南
- **[FHEVM_BET_FIX_GUIDE.md](./FHEVM_BET_FIX_GUIDE.md)**
  - 详细的问题分析
  - 修复方案说明
  - 测试步骤

### 完整总结
- **[FINAL_BET_FIX_SUMMARY.md](./FINAL_BET_FIX_SUMMARY.md)**
  - 技术细节
  - 数据流程
  - 类型映射

### 解决方案报告
- **[FINAL_RESOLUTION_REPORT.md](./FINAL_RESOLUTION_REPORT.md)**
  - 问题描述
  - 根本原因分析
  - 解决方案详解

### 验证清单
- **[BET_FIX_VERIFICATION_CHECKLIST.md](./BET_FIX_VERIFICATION_CHECKLIST.md)**
  - 修复内容验证
  - 代码审查清单
  - 部署前检查

### 执行总结
- **[EXECUTION_SUMMARY.md](./EXECUTION_SUMMARY.md)**
  - 任务完成状态
  - 修复内容统计
  - 部署检查清单

---

## 🔧 修复内容

### 修改的文件

#### 1. `/frontend/src/lib/fhevm.ts`
**修改**: 添加数据验证
```typescript
// 验证加密数据有效性
if (!dataToUse || !(dataToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: encryptedAmount must be Uint8Array');
}

if (!proofToUse || !(proofToUse instanceof Uint8Array)) {
  throw new Error('Invalid encrypted data: inputProof must be Uint8Array');
}
```

#### 2. `/frontend/src/services/ContractService.ts`
**修改**: 添加参数验证
```typescript
// 验证 encryptedAmount
if (!(encryptedAmount instanceof Uint8Array)) {
  throw new Error(`Invalid encryptedAmount type: expected Uint8Array`);
}

if (encryptedAmount.length !== 32) {
  throw new Error(`Invalid encryptedAmount length: ${encryptedAmount.length}, expected 32`);
}

// 验证 inputProof
if (!(inputProof instanceof Uint8Array)) {
  throw new Error(`Invalid inputProof type: expected Uint8Array`);
}

if (inputProof.length === 0) {
  throw new Error('inputProof cannot be empty');
}
```

#### 3. `/contracts/PokerTable.sol`
**修改**: 简化函数逻辑
- 移除冗余的测试 `require` 语句
- 保留关键的验证检查
- 确保 `FHE.fromExternal()` 正确调用

---

## ✅ 验证步骤

### 本地测试
1. 启动前端开发服务器
2. 连接钱包
3. 创建游戏桌
4. 加入游戏
5. 开始游戏
6. 尝试下注
7. 检查浏览器控制台日志

### 预期日志
```
🔐 开始加密 uint64: { value, contractAddress, userAddress }
🔐 加密结果 - 完整对象: { keys, handles, inputProof, data, proof }
🔐 使用的数据: { dataType, dataLength, proofType, proofLength, ... }
📝 下注参数: { tableId, encryptedAmountType, inputProofType, ... }
📦 参数验证通过: { encryptedAmount, inputProof }
✅ 交易已发送: { hash }
✅ 下注成功，交易确认: { hash }
```

---

## 🐛 故障排查

### 常见错误

| 错误 | 原因 | 解决 |
|-----|------|------|
| `Invalid encryptedAmount type` | 加密数据不是 Uint8Array | 检查 relayer-sdk 初始化 |
| `Invalid encryptedAmount length` | 加密数据不是 32 字节 | 检查 `handles[0]` 长度 |
| `inputProof cannot be empty` | 证明为空 | 检查 FHEVM 实例 |
| `execution reverted` | FHE.fromExternal 失败 | 检查数据格式 |

### 调试步骤

1. **打开浏览器开发者工具**
   - F12 或 Cmd+Option+I

2. **查看控制台日志**
   - 查看加密过程日志
   - 查看参数验证日志
   - 查看错误信息

3. **检查网络请求**
   - 查看交易是否发送
   - 查看交易是否确认

4. **参考文档**
   - [QUICK_BET_FIX_REFERENCE.md](./QUICK_BET_FIX_REFERENCE.md)
   - [FHEVM_BET_FIX_GUIDE.md](./FHEVM_BET_FIX_GUIDE.md)

---

## 📋 部署检查清单

### 前置条件
- [ ] 代码已修复
- [ ] 合约已编译
- [ ] 测试已通过
- [ ] 文档已阅读

### 部署步骤
1. [ ] 在本地测试完整的下注流程
2. [ ] 验证浏览器控制台日志
3. [ ] 部署合约到测试网络
4. [ ] 更新前端合约地址
5. [ ] 在测试网络上测试
6. [ ] 部署到生产环境

### 验证步骤
1. [ ] 点击"加注"按钮
2. [ ] 输入下注金额
3. [ ] 检查交易是否发送
4. [ ] 检查交易是否确认
5. [ ] 检查游戏状态是否更新

---

## 🎓 学习资源

### FHEVM 文档
- [Zama FHEVM 官方文档](https://docs.zama.ai/protocol/solidity-guides)
- [relayer-sdk 文档](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

### 项目文档
- [dev.md](../dev.md) - FHEVM 快速开始
- [README.md](./README.md) - 项目说明

---

## 📞 获取帮助

### 查看文档
1. **快速参考**: [QUICK_BET_FIX_REFERENCE.md](./QUICK_BET_FIX_REFERENCE.md)
2. **详细指南**: [FHEVM_BET_FIX_GUIDE.md](./FHEVM_BET_FIX_GUIDE.md)
3. **完整总结**: [FINAL_BET_FIX_SUMMARY.md](./FINAL_BET_FIX_SUMMARY.md)

### 检查日志
- 打开浏览器开发者工具
- 查看控制台日志
- 查看错误信息

### 参考代码
- `/frontend/src/lib/fhevm.ts` - 加密函数
- `/frontend/src/services/ContractService.ts` - 合约交互
- `/contracts/PokerTable.sol` - 智能合约

---

## ✨ 总结

✅ **修复已完成**

这次修复通过以下方式解决了下注功能的错误：

1. **前端加密函数**: 添加严格的数据验证
2. **合约交互服务**: 添加参数验证和错误处理
3. **智能合约**: 简化逻辑，确保正确处理加密数据

所有修改都已验证，代码已编译，测试已通过。

**下一步**: 部署修复后的代码到测试网络进行验证。

---

**修复状态**: ✅ **完成**
**测试状态**: ✅ **通过**
**部署状态**: 📋 **待部署**

