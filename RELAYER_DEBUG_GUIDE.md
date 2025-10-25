# 🔍 Relayer 400 错误调试指南

## 问题描述

**错误信息**:
```
POST https://relayer.testnet.zama.cloud/v1/input-proof 400 (Bad Request)
Error: Relayer didn't response correctly. Bad status . Content: 
{"message":"Transaction rejected: \"Input request failed: Transaction failed: Transaction failed: Failed to check contract code: backend connection task has stopped\""}
```

**发生时机**: 在调用 `encryptBuyIn()` 加密买入金额时

## 🎯 使用调试工具

我已经创建了一个专门的调试工具，不会影响你现有的代码。

### 步骤1: 访问调试页面

在前端服务器运行时，访问：
```
http://localhost:5173/src/test-relayer-debug.html
```

### 步骤2: 运行测试

调试工具提供了5个测试步骤：

1. **步骤1: 连接钱包** - 验证钱包连接和网络
2. **步骤2: 检查SDK加载** - 确认Relayer SDK正确加载
3. **步骤3: 测试Relayer连接** - 测试直接访问和代理访问
4. **步骤4: 初始化FHEVM** - 尝试不同的配置初始化
5. **步骤5: 测试加密** - 实际测试加密功能

你可以：
- 逐步点击每个测试按钮
- 或点击"运行全部测试"一次性运行

### 步骤3: 查看日志

调试工具会显示详细的日志信息，包括：
- ✅ 成功的操作（绿色）
- ❌ 失败的操作（红色）
- ℹ️ 信息提示（黄色）

## 🔍 根据dev.md的分析

根据Zama官方文档，这个错误的可能原因：

### 1. **Relayer服务问题** 🚨

**症状**: "backend connection task has stopped"

**原因**: 
- Zama的Relayer后端服务暂时不可用
- 这是基础设施问题，不是代码问题

**验证方法**:
```javascript
// 在浏览器控制台运行
fetch('https://relayer.testnet.zama.cloud/v1/keyurl')
  .then(r => console.log('状态:', r.status))
  .catch(e => console.log('错误:', e))
```

**解决方案**:
- 等待Zama修复服务
- 检查 [Zama社区](https://community.zama.ai/) 是否有其他人报告同样问题

### 2. **加密输入验证问题** 🔐

根据dev.md第2000-2130行，加密输入需要：

**关键要求**:
1. 使用正确的合约地址
2. 使用正确的用户地址
3. 生成有效的ZKPoK（零知识证明）

**验证代码**:
```typescript
// 正确的加密方式（参考dev.md第2037-2058行）
const input = fhevm.createEncryptedInput(contractAddress, userAddress);
input.add64(amount);
const encryptedInput = await input.encrypt();

// 使用加密数据
const handle = encryptedInput.handles[0];
const proof = encryptedInput.inputProof;
```

### 3. **ACL权限问题** 🔒

根据dev.md第2133-2204行，ACL（访问控制列表）可能导致问题：

**关键点**:
- 加密数据必须绑定到正确的合约地址
- 加密数据必须绑定到正确的用户地址
- 如果地址不匹配，会导致验证失败

**检查清单**:
```javascript
// 1. 验证合约地址
console.log('合约地址:', CONTRACT_ADDRESS);

// 2. 验证用户地址
console.log('用户地址:', userAddress);

// 3. 验证地址格式（必须是校验和格式）
const { getAddress } = require('ethers');
const checksumAddress = getAddress(userAddress);
console.log('校验和地址:', checksumAddress);
```

### 4. **网络和CORS问题** 🌐

**可能的问题**:
- Cloudflare WAF阻拦
- CORS策略限制
- 网络防火墙

**调试工具会测试**:
- 直接访问Relayer
- 通过Vite代理访问
- CORS头检查

## 📊 调试工具输出分析

### 成功的输出应该是：

```
✅ 钱包已连接: 0x...
✅ 网络 ChainId: 11155111
✅ Relayer SDK 已加载
✅ 直接访问状态码: 200
✅ FHEVM 实例创建成功
✅ 加密完成! 耗时: XXXms
✅ handles[0] 长度: 32
✅ inputProof 长度: XXX
```

### 如果看到错误：

#### 错误1: "backend connection task has stopped"
```
❌ 加密测试失败: backend connection task has stopped
🔍 可能原因:
   1. Relayer 服务暂时不可用
   2. 网络连接问题或防火墙阻拦
   3. 合约地址配置错误
   4. 用户地址格式问题
```

**解决方案**:
1. 等待几分钟后重试
2. 检查网络连接
3. 尝试使用VPN
4. 联系Zama技术支持

#### 错误2: "SDK 加载超时"
```
❌ SDK 加载失败: Relayer SDK 加载超时
```

**解决方案**:
1. 检查CDN是否可访问
2. 清除浏览器缓存
3. 检查网络连接

#### 错误3: "CORS错误"
```
❌ 直接访问失败: CORS policy
```

**解决方案**:
- 这是正常的，应该使用代理访问
- 检查Vite代理配置是否正确

## 🔧 根据测试结果的修复方案

### 场景A: Relayer服务不可用

**症状**: 所有配置都返回400错误

**解决方案**:
1. 等待Zama修复服务
2. 查看Zama状态页面
3. 在社区询问

### 场景B: 配置问题

**症状**: 某个配置成功，某个配置失败

**解决方案**:
1. 使用成功的配置
2. 更新项目中的配置

### 场景C: 合约地址问题

**症状**: 加密成功但合约调用失败

**解决方案**:
1. 验证合约地址是否正确部署
2. 检查合约是否在Sepolia测试网上

## 📞 获取帮助

如果调试工具显示错误，请：

1. **截图完整的日志输出**
2. **记录测试数据部分的信息**
3. **在以下渠道寻求帮助**:
   - Zama社区论坛: https://community.zama.ai/
   - Discord: https://discord.com/invite/zama
   - GitHub Issues: https://github.com/zama-ai/fhevm

## 🎯 下一步行动

1. **立即运行调试工具**
   ```
   http://localhost:5173/src/test-relayer-debug.html
   ```

2. **根据测试结果判断问题类型**

3. **如果是Relayer服务问题**:
   - 等待服务恢复
   - 在社区查看是否有其他人遇到同样问题

4. **如果是配置问题**:
   - 使用调试工具找到正确的配置
   - 更新项目代码

5. **如果是网络问题**:
   - 尝试不同的网络环境
   - 使用VPN

## 📝 技术细节参考

根据dev.md文档：

### 加密输入的正确使用（第2000-2130行）

```typescript
// 1. 创建加密输入
const input = fhevm.createEncryptedInput(contractAddress, userAddress);

// 2. 添加值
input.add64(amount);  // 对于euint64

// 3. 加密
const encryptedInput = await input.encrypt();

// 4. 获取结果
const handle = encryptedInput.handles[0];
const proof = encryptedInput.inputProof;

// 5. 调用合约
await contract.joinTable(tableId, handle, proof);
```

### ACL权限管理（第2133-2204行）

```solidity
// 在合约中验证和使用加密输入
function joinTable(
    uint256 tableId,
    externalEuint64 encryptedBuyIn,
    bytes calldata inputProof
) public {
    // 验证并转换
    euint64 buyIn = FHE.fromExternal(encryptedBuyIn, inputProof);
    
    // 授予权限
    FHE.allowThis(buyIn);
    FHE.allow(buyIn, msg.sender);
    
    // 使用加密值
    player.balance = buyIn;
}
```

## ⚠️ 重要提示

1. **不要修改现有代码** - 调试工具是独立的
2. **记录所有测试结果** - 便于分析问题
3. **耐心等待** - Relayer服务问题需要Zama团队修复
4. **保持更新** - 关注Zama社区的最新消息

---

**创建时间**: 2025-10-23
**工具位置**: `/frontend/src/test-relayer-debug.html`
**文档参考**: `/dev.md`
