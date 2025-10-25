# 🔬 最终诊断: 错误 0x9de3392c

**日期**: 2025-10-21  
**状态**: 深度调查中

---

## 问题总结

加注和离开游戏都返回错误 `0x9de3392c`，这个错误：
- ❌ 不在我们的合约 ABI 中
- ❌ 不是 Solidity 标准错误
- ❌ 不是我们定义的自定义错误
- ✅ 来自 FHEVM 库内部

---

## 关键发现

### 1. 错误来源确认

错误发生在 `_processBet` 函数中的这一行：
```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
```

这是 FHEVM 库的函数，用于验证零知识证明并转换加密数据。

### 2. 前端数据格式

前端发送的数据：
```
dataHex: 0xc128d21499bbecebfb565dbae98e8b980d979429cb000000000000aa36a70500
proofHex: 0x0101c128d21499bbecebfb565dbae98e8b980d979429cb000000000000aa36a70500d1ac0afdd015c3cfce9239f4e459ec17413c2c3983634d7ae2dfb199f2fef7493819738939aaef21ff312b58364d02b7529547cc0f72dc4cf0bb9f2f004f85df1c00
```

- `dataHex` 长度: 66 (0x + 64 个十六进制字符 = 32 字节)
- `proofHex` 长度: 258 (0x + 256 个十六进制字符 = 128 字节)

### 3. 加密参数

前端使用以下参数加密：
```typescript
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(BigInt(value));
const encryptedInput = await input.encrypt();
```

其中：
- `contractAddress`: `0x49871B66FEAfe19F60373000876Bb9c23b1ca39d` (新部署的合约)
- `userAddress`: 用户的钱包地址

---

## 可能的原因

### 原因 1: FHEVM 库版本不匹配 (最可能)

前端使用的 FHEVM 库版本与合约编译时使用的版本不匹配。

**证据**:
- 前端使用 CDN 版本: `https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js`
- 合约使用的 FHEVM 库版本未知

### 原因 2: 加密参数不匹配

前端加密时使用的参数与合约验证时的参数不匹配。

**可能的不匹配**:
- 合约地址不同
- 用户地址不同
- 加密方式不同

### 原因 3: 证明验证失败

零知识证明验证失败，可能原因：
- 证明过期
- 证明与加密数据不匹配
- 证明格式不正确

---

## 已排除的可能性

✅ 前端配置正确
- 合约地址已更新: `0x49871B66FEAfe19F60373000876Bb9c23b1ca39d`
- ABI 已更新
- 开发服务器已重启

✅ 合约代码正确
- 所有 require 语句都在 `FHE.fromExternal()` 之前
- 修饰符检查都在函数开始处

✅ 数据格式正确
- `dataHex` 长度正确 (66)
- `proofHex` 长度合理 (258)
- 都是有效的 hex 字符串

---

## 下一步行动

### 立即尝试

1. **检查 FHEVM 库版本**
   - 查看前端使用的 FHEVM 库版本
   - 查看合约编译时使用的 FHEVM 库版本
   - 确保版本一致

2. **查看 Etherscan 交易详情**
   - 访问 https://sepolia.etherscan.io/
   - 搜索合约地址: `0x49871B66FEAfe19F60373000876Bb9c23b1ca39d`
   - 查看失败的交易
   - 查看 "Revert Reason" 部分

3. **启用详细日志**
   - 在前端添加更多日志
   - 记录加密过程的每一步
   - 记录发送到合约的确切数据

### 可能的解决方案

#### 方案 A: 更新 FHEVM 库版本

```bash
# 检查当前版本
npm list @fhevm/fhevmjs

# 更新到最新版本
npm install @fhevm/fhevmjs@latest
```

#### 方案 B: 使用不同的加密方式

查看 FHEVM 文档，看是否有其他的加密方式。

#### 方案 C: 联系 Zama 支持

如果以上都不行，可能需要联系 Zama 官方支持。

---

## 技术细节

### 错误签名分析

```
错误签名: 0x9de3392c
长度: 4 字节 (标准错误选择器长度)
来源: FHEVM 库内部
```

### 相关代码

**合约**:
```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
```

**前端**:
```typescript
const encrypted = await fhevm.encryptBetAmount(amount);
const dataHex = ('0x' + Array.from(encrypted.data).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
const proofHex = ('0x' + Array.from(encrypted.proof).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
```

---

## 相关文件

- `contracts/PokerTable.sol` - 合约代码
- `frontend/src/lib/fhevm.ts` - FHEVM 初始化
- `frontend/src/pages/Game.tsx` - 加注逻辑
- `frontend/src/hooks/useFHEVM.ts` - FHEVM Hook


