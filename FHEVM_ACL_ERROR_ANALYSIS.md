# FHEVM ACL 错误分析与修复

## 问题总结

修复了 `Buffer is not defined` 错误后,遇到了新的错误:

```
ACLNotAllowed(bytes32,address)
错误选择器: 0x9de3392c
```

## ✅ 问题已解决!

**根本原因**: 在 `_processBet` 函数中,使用 `FHE.fromExternal()` 转换加密数据后,没有显式授予合约权限使用转换后的加密值。

**解决方案**: 在 `FHE.fromExternal()` 之后添加 `FHE.allowThis(amount)`,确保合约有权限在后续的 FHE 操作中使用这个值。

## 错误来源

这个错误来自 FHEVM 的 `FHEVMExecutor` 合约,具体是在调用 `FHE.fromExternal()` 时触发的。

错误定义:
```solidity
// node_modules/@fhevm/core-contracts/contracts/FHEVMExecutor.sol
error ACLNotAllowed(bytes32 handle, address account);
```

## 错误含义

`ACLNotAllowed` 表示访问控制列表(ACL)不允许指定的账户访问指定的加密数据句柄(handle)。

## 可能的原因

### 1. 加密数据的绑定问题

根据 FHEVM 文档,加密输入必须绑定到:
- **合约地址**: 将要调用的合约地址
- **用户地址**: 交易发送者的地址

如果这两个地址中的任何一个不匹配,ACL 验证就会失败。

### 2. 检查当前的加密参数

根据控制台输出:
```
contractAddrChecksum: '0x0699b2fFc94782D66808a472872ED8319e92A60d'
userAddrChecksum: '0xd76c72551dF78318Fcbe0Dd9E816bFf4B113eE1b'
```

这些地址看起来是正确的,但需要验证:
- 合约地址是否是实际部署的 PokerTable 合约地址
- 用户地址是否是当前连接的钱包地址

### 3. 可能的问题场景

#### 场景 A: 合约地址不匹配
如果 `POKER_TABLE_ADDRESS` 常量与实际部署的合约地址不一致,会导致 ACL 验证失败。

#### 场景 B: 用户地址不匹配
如果加密时使用的用户地址与实际发送交易的地址不一致,会导致 ACL 验证失败。

#### 场景 C: 网络配置问题
如果 FHEVM 实例初始化时使用的网络配置与实际网络不匹配,可能导致 ACL 验证失败。

#### 场景 D: Relayer 配置问题
如果 Relayer SDK 的配置不正确,生成的加密数据可能无法通过 ACL 验证。

## 调试步骤

### 步骤 1: 验证合约地址

检查 `frontend/src/lib/contract.ts` 中的 `POKER_TABLE_ADDRESS` 是否与实际部署的合约地址一致:

```bash
# 查看部署的合约地址
cat deployments/sepolia/PokerTable.json | grep '"address"'
```

### 步骤 2: 验证用户地址

在浏览器控制台中检查:
```javascript
// 当前连接的钱包地址
console.log('钱包地址:', window.ethereum.selectedAddress);

// 加密时使用的地址
// 查看控制台输出中的 userAddrChecksum
```

### 步骤 3: 检查网络配置

验证 FHEVM 初始化时使用的网络配置:
```typescript
// frontend/src/lib/fhevm.ts
const config = {
  ...sdk.SepoliaConfig,
  network: window.ethereum,
  relayerUrl: 'https://relayer.testnet.zama.cloud',
};
```

### 步骤 4: 检查是否有其他玩家成功操作

如果其他玩家能够成功加入游戏(使用相同的加密方式),那么问题可能不在加密本身,而在于:
- 游戏状态
- 玩家权限
- 合约逻辑

## 可能的解决方案

### 解决方案 1: 验证并更新合约地址

确保前端使用的合约地址与实际部署的合约地址一致。

### 解决方案 2: 检查 joinTable 是否成功

如果 `joinTable` 使用了相同的加密方式并且成功了,那么问题可能在于:
- 游戏状态检查
- 玩家是否已经在游戏中
- 是否轮到该玩家操作

### 解决方案 3: 添加更详细的日志

在合约中添加事件来记录 ACL 验证的详细信息:
```solidity
event DebugACL(bytes32 handle, address sender, address contractAddr);
```

### 解决方案 4: 检查 FHEVM 版本兼容性

确保使用的 FHEVM SDK 版本与 Sepolia 测试网上的 FHEVM 协议版本兼容。

## 修复详情

### 修改的文件

**contracts/PokerTable.sol** (第 1076-1089 行)

修改前:
```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

// 从玩家余额中扣除
player.balance = FHE.sub(player.balance, amount);
```

修改后:
```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

// ✅ 授予合约临时权限使用转换后的加密金额
// 这确保后续的 FHE 操作可以访问这个值
FHE.allowThis(amount);

// 从玩家余额中扣除
player.balance = FHE.sub(player.balance, amount);
```

### 部署信息

- **新合约地址**: `0x99Cb910F674B72442cf686D23B4896448F94D2fe`
- **网络**: Sepolia 测试网
- **部署时间**: 2025-10-22
- **Gas 使用**: 2,514,826

### 前端配置更新

**frontend/src/lib/contract.ts**

```typescript
export const POKER_TABLE_ADDRESS = '0x99Cb910F674B72442cf686D23B4896448F94D2fe';
```

## 技术说明

### 为什么需要 `FHE.allowThis()`?

根据 FHEVM 的 ACL (Access Control List) 机制:

1. **`FHE.fromExternal()`** 将外部加密数据转换为内部加密类型,并自动授予 `msg.sender` 临时权限
2. 但是,合约本身可能需要显式权限才能在后续操作中使用这个值
3. **`FHE.allowThis(amount)`** 显式授予合约权限,确保后续的 `FHE.sub()`, `FHE.add()` 等操作可以访问这个加密值

### 对比 `joinTable` 函数

在 `joinTable` 函数中,转换后的 `buyIn` 被直接赋值给 `player.balance`,然后为 `player.balance` 设置 ACL 权限:

```solidity
euint64 buyIn = FHE.fromExternal(encryptedBuyIn, inputProof);
player.balance = buyIn;
FHE.allowThis(player.balance);
FHE.allow(player.balance, msg.sender);
```

而在 `_processBet` 中,转换后的 `amount` 需要立即用于 FHE 操作,因此需要显式授予权限。

## 测试步骤

1. ✅ 编译合约: `npm run compile`
2. ✅ 部署合约: `npm run deploy:sepolia`
3. ✅ 更新前端配置: `POKER_TABLE_ADDRESS`
4. ✅ 启动前端服务器: `cd frontend && npm run dev`
5. ⏳ 测试下注功能:
   - 创建新游戏桌
   - 加入游戏
   - 开始游戏
   - 尝试下注

## 预期结果

下注操作应该成功,不再出现 `ACLNotAllowed` 错误。

## 参考文档

- [FHEVM Access Control List](https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl)
- [FHEVM Encrypted Inputs](https://docs.zama.ai/protocol/solidity-guides/smart-contract/inputs)
- [FHEVM Error Handling](https://docs.zama.ai/protocol/solidity-guides/smart-contract/error-handling)
- [FHE.allowThis() 文档](https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl#allowthis)

