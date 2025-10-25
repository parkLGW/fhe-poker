# FHEVM 地址格式修复

## 🔍 问题发现

通过仔细阅读 Zama 官方 dev.md 文档，我发现了加注失败的**真正原因**！

### 错误的做法（之前的代码）

```typescript
// ❌ 错误：先转小写，再转校验和
const contractAddr = POKER_TABLE_ADDRESS.toLowerCase();  // 转小写
const userAddr = address.toLowerCase();                   // 转小写
return encryptUint64(amount, contractAddr, userAddr);

// 在 encryptUint64 中：
const checksumContractAddr = getAddress(contractAddress);  // 再转校验和
const checksumUserAddr = getAddress(userAddress);          // 再转校验和
```

**问题**：地址被转换了两次，可能导致格式不一致！

### 正确的做法（根据 dev.md）

```typescript
// ✅ 正确：直接传递原始地址
const encryptedOne = await fhevm
  .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
  .add32(clearOne)
  .encrypt();
```

**关键点**：
- 直接传递原始地址（可以是任何格式）
- 让 `encryptUint64` 中的 `getAddress()` 统一处理校验和格式
- 确保加密时使用的地址与合约中验证的地址完全一致

## 📝 修复内容

### 修改文件：`frontend/src/hooks/useFHEVM.ts`

#### 修复前
```typescript
const encryptBetAmount = async (amount: number) => {
  const contractAddr = POKER_TABLE_ADDRESS.toLowerCase();
  const userAddr = address.toLowerCase();
  return encryptUint64(amount, contractAddr, userAddr);
};
```

#### 修复后
```typescript
const encryptBetAmount = async (amount: number) => {
  // ✅ 直接传递原始地址，让 encryptUint64 中的 getAddress() 处理校验和格式
  return encryptUint64(amount, POKER_TABLE_ADDRESS, address);
};
```

### 同样修复的函数
- ✅ `encryptBuyIn()`
- ✅ `encryptBetAmount()`
- ✅ `encryptCard()`

## 🔐 FHEVM 加密流程（正确的）

```
1. 前端：encryptBetAmount(100)
   ↓
2. 调用 encryptUint64(100, POKER_TABLE_ADDRESS, userAddress)
   ↓
3. 在 encryptUint64 中：
   - 使用 getAddress() 统一转换为校验和格式
   - 创建加密输入：instance.createEncryptedInput(checksumAddr, checksumUser)
   - 添加值：input.add64(BigInt(100))
   - 加密：encryptedInput = await input.encrypt()
   ↓
4. 返回：
   - encryptedAmount: encryptedInput.handles[0]  (Uint8Array, 32字节)
   - inputProof: encryptedInput.inputProof       (Uint8Array)
   ↓
5. 前端调用合约：
   contract.bet(tableId, encryptedAmount, inputProof)
   ↓
6. 合约中：
   - FHE.fromExternal(encryptedAmount, inputProof)
   - 验证 inputProof 是否由 msg.sender 为当前合约创建
   - 如果地址不匹配 → 验证失败 → 错误 0x9de3392c
```

## ✅ 为什么这个修复有效

1. **地址一致性**：确保加密时使用的地址与合约验证时使用的地址完全相同
2. **单一转换点**：只在 `encryptUint64` 中进行一次地址格式转换
3. **符合官方示例**：与 Zama dev.md 中的示例代码完全一致

## 🧪 测试步骤

1. **清除缓存**
   ```bash
   # 清除浏览器缓存或使用无痕模式
   ```

2. **重启前端**
   ```bash
   cd frontend
   npm run dev
   ```

3. **测试加注**
   - 连接钱包
   - 创建/加入游戏
   - 开始游戏
   - 点击"加注"
   - 输入金额

## 📊 预期结果

- ✅ 加注成功
- ✅ 游戏状态更新
- ✅ 轮到下一个玩家

## 🔗 参考

- Zama dev.md 第 1344-1347 行：加密输入的正确用法
- Zama dev.md 第 1356-1358 行：地址绑定的说明
- Zama dev.md 第 1369-1376 行：inputProof 的作用

## 📌 关键要点

> **FHEVM 要求加密时使用的地址必须与合约验证时使用的地址完全一致。**
> 
> 任何地址格式的不一致都会导致 `FHE.fromExternal()` 验证失败。

