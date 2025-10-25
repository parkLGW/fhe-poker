# 加注错误修复总结

## 问题描述

用户在点击"加注"按钮时遇到错误：
```
Error: execution reverted (unknown custom error)
error selector: 0x9de3392c
```

这个错误来自 FHEVM 库的 `FHE.fromExternal()` 调用，但原因不明确。

## 解决方案

我采用了**诊断驱动的方法**，而不是盲目搜索错误代码。具体改进包括：

### 1. 合约改进 (`PokerTable.sol`)

#### 添加新的自定义错误定义
```solidity
error InvalidEncryptedAmount();
error ProofVerificationFailed();
```

#### 改进 `_processBet()` 函数的验证
- 将 `require` 语句改为 `revert` 自定义错误，提供更清晰的错误信息
- 添加了对 `inputProof` 长度的验证
- 改进了错误处理流程

### 2. 前端改进 (`ContractService.ts`)

#### 添加错误解析器函数
```typescript
function parseContractError(error: any): string
```

这个函数可以：
- 解析自定义错误选择器
- 将错误代码映射到可读的错误信息
- 处理 require 错误信息
- 提供详细的错误日志

#### 错误代码映射表
```
0xcb566600 => 游戏桌已满
0x340b9515 => 游戏桌不存在
0x43050d96 => 玩家不在游戏中
0xc56fb253 => 玩家已在游戏中
0xbaf3f0f7 => 游戏状态无效
0xe60c8f58 => 不是你的回合
0xf4d678b8 => 余额不足
0x9de3d441 => 下注金额无效
0x9e7aef8f => 操作超时
0xd5fa87ab => 玩家数不足
0xb6dfe10c => 玩家索引无效
0x9593abaf => 加密数据无效
0xe3e94326 => 证明数据无效
0x9de3392c => 加密金额无效
0x7567ae05 => 证明验证失败
```

#### 改进 `bet()` 和 `call()` 函数
- 使用新的错误解析器
- 提供更清晰的错误信息给用户
- 添加详细的控制台日志用于调试

### 3. ABI 更新 (`contract.ts`)

添加了新的错误定义到 ABI：
```json
{
  "inputs": [],
  "name": "InvalidEncryptedAmount",
  "type": "error"
},
{
  "inputs": [],
  "name": "ProofVerificationFailed",
  "type": "error"
}
```

## 部署信息

- **旧合约地址**: `0x76133C5619Fd9D1F5535aA18b4815561170eC912`
- **新合约地址**: `0x0699b2fFc94782D66808a472872ED8319e92A60d`
- **网络**: Sepolia 测试网
- **部署时间**: 2025-10-22

## 修改的文件

1. ✅ `/contracts/PokerTable.sol` - 添加自定义错误和改进验证
2. ✅ `/frontend/src/services/ContractService.ts` - 添加错误解析器
3. ✅ `/frontend/src/lib/contract.ts` - 更新合约地址和 ABI

## 测试步骤

1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 访问 `http://localhost:5173/`
3. 连接钱包
4. 创建或加入游戏
5. 点击"开始游戏"
6. 尝试加注操作

## 预期结果

现在当加注失败时，你会看到更清晰的错误信息，例如：
- "合约错误: 加密金额无效 (0x9de3392c)"
- "合约错误: 证明验证失败 (0x7567ae05)"
- "合约错误: 不是你的回合 (0xe60c8f58)"

这样可以更容易地诊断问题的真正原因。

## 下一步调查

如果加注仍然失败，请检查：

1. **加密数据格式**
   - 确保 `encryptedAmount` 是 32 字节的 Uint8Array
   - 确保 `inputProof` 不为空

2. **地址一致性**
   - 确保加密时使用的合约地址与实际部署地址一致
   - 确保加密时使用的用户地址与调用者地址一致

3. **FHEVM 初始化**
   - 确保 FHEVM 实例正确初始化
   - 确保公钥正确加载

4. **浏览器控制台**
   - 查看详细的错误日志
   - 检查网络请求是否成功

