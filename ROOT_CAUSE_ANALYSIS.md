# 加注失败根本原因分析

## 🎯 问题

用户点击"加注"按钮时，收到错误：
```
Error: execution reverted (unknown custom error)
error selector: 0x9de3392c
```

## 🔍 根本原因

**地址格式不一致导致 FHEVM 验证失败**

### 问题代码流程

```
前端 useFHEVM.ts:
  encryptBetAmount(100)
    ↓
  const contractAddr = POKER_TABLE_ADDRESS.toLowerCase()  // ❌ 转小写
  const userAddr = address.toLowerCase()                   // ❌ 转小写
  return encryptUint64(amount, contractAddr, userAddr)
    ↓
前端 fhevm.ts:
  encryptUint64(amount, contractAddr, userAddr)
    ↓
  const checksumContractAddr = getAddress(contractAddress)  // ❌ 再转校验和
  const checksumUserAddr = getAddress(userAddress)          // ❌ 再转校验和
  instance.createEncryptedInput(checksumContractAddr, checksumUserAddr)
    ↓
  返回加密数据和证明
    ↓
合约验证：
  FHE.fromExternal(encryptedAmount, inputProof)
    ↓
  验证 inputProof 是否由 msg.sender 为当前合约创建
    ↓
  ❌ 地址不匹配 → 验证失败 → 错误 0x9de3392c
```

### 为什么会失败

FHEVM 的 `FHE.fromExternal()` 验证流程：

1. 检查 `inputProof` 是否由 `msg.sender` 创建
2. 检查 `inputProof` 是否为当前合约地址创建
3. **如果地址不匹配，验证失败**

由于地址被转换了两次，可能导致：
- 加密时使用的地址：`0x76133c5619fd9d1f5535aa18b4815561170ec912` (小写)
- 合约验证时的地址：`0x76133C5619Fd9D1F5535aA18b4815561170eC912` (校验和)

虽然这两个地址在逻辑上相同，但在加密验证中，**字节级别的差异会导致验证失败**。

## ✅ 解决方案

### 修改原则

**直接传递原始地址，让 `encryptUint64` 统一处理校验和转换**

### 修改前

```typescript
// ❌ 错误：多次转换
const contractAddr = POKER_TABLE_ADDRESS.toLowerCase();
const userAddr = address.toLowerCase();
return encryptUint64(amount, contractAddr, userAddr);
```

### 修改后

```typescript
// ✅ 正确：直接传递原始地址
return encryptUint64(amount, POKER_TABLE_ADDRESS, address);
```

### 修改的函数

1. `encryptBuyIn()` - 加密买入金额
2. `encryptBetAmount()` - 加密下注金额
3. `encryptCard()` - 加密扑克牌

## 📚 官方文档支持

Zama dev.md 第 1344-1347 行的示例：

```typescript
const encryptedOne = await fhevm
  .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
  .add32(clearOne)
  .encrypt();
```

**关键点**：
- 直接传递 `fheCounterContractAddress` 和 `signers.alice.address`
- 不进行任何预处理
- 让库内部处理地址格式

## 🔐 FHEVM 安全机制

FHEVM 的 `inputProof` 包含以下信息：
- 加密者的地址（msg.sender）
- 目标合约的地址
- 加密的数据

验证时，FHEVM 会检查：
1. 当前调用者是否是加密者
2. 当前合约是否是目标合约
3. 地址是否完全匹配（包括大小写）

## 🧪 验证修复

修复后，加密流程应该是：

```
前端 useFHEVM.ts:
  encryptBetAmount(100)
    ↓
  return encryptUint64(amount, POKER_TABLE_ADDRESS, address)
    ↓
前端 fhevm.ts:
  encryptUint64(amount, POKER_TABLE_ADDRESS, address)
    ↓
  const checksumContractAddr = getAddress(POKER_TABLE_ADDRESS)
  const checksumUserAddr = getAddress(address)
  instance.createEncryptedInput(checksumContractAddr, checksumUserAddr)
    ↓
  返回加密数据和证明
    ↓
合约验证：
  FHE.fromExternal(encryptedAmount, inputProof)
    ↓
  ✅ 地址匹配 → 验证成功 → 加注成功
```

## 📌 关键教训

1. **FHEVM 对地址格式敏感** - 必须确保一致性
2. **避免多次转换** - 在一个地方统一处理
3. **参考官方示例** - 官方文档中的代码是最佳实践
4. **理解加密验证** - 了解 `inputProof` 的作用很重要

## 🚀 下一步

1. 清除浏览器缓存
2. 重启前端服务
3. 测试加注功能
4. 验证其他加密操作（买入、出牌等）

