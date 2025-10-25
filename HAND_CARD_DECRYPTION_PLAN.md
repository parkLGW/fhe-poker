# 手牌解密实现方案

## 问题说明

当前手牌显示为 `??`,因为手牌在链上是**加密存储**的(`euint8` 类型)。这是 FHEVM 的核心特性 - 保护玩家隐私。

## 解决方案

需要实现**用户解密(User Decryption)**功能,将加密的手牌解密后显示给玩家。

### 技术原理

1. **合约返回加密的手牌 handle** (bytes32)
2. **前端使用 Relayer SDK 进行用户解密**:
   - 生成临时密钥对
   - 使用 EIP-712 签名授权解密请求
   - 调用 Relayer 服务进行解密
   - 返回明文值

### 前提条件

✅ **ACL 权限已设置**: 在 `_dealHoleCards` 和 `joinTable` 函数中,已经调用了 `FHE.allow(card, player.addr)`,允许玩家访问自己的手牌。

## 实现步骤

### 步骤 1: 在 `fhevm.ts` 中添加解密函数

```typescript
/**
 * 解密 euint8 值(用于手牌)
 * @param handle 加密值的 handle (bytes32)
 * @param contractAddress 合约地址
 * @param userAddress 用户地址
 * @param signer ethers Signer 对象
 * @returns 解密后的数值
 */
export async function decryptUint8(
  handle: string,
  contractAddress: string,
  userAddress: string,
  signer: any
): Promise<number> {
  const instance = await initFHEVM();
  
  // 生成临时密钥对
  const keypair = instance.generateKeypair();
  
  // 准备解密请求
  const handleContractPairs = [
    {
      handle: handle,
      contractAddress: contractAddress,
    },
  ];
  
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10'; // 10天有效期
  const contractAddresses = [contractAddress];
  
  // 创建 EIP-712 签名数据
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays,
  );
  
  // 用户签名授权解密
  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message,
  );
  
  // 调用 Relayer 进行解密
  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    contractAddresses,
    userAddress,
    startTimeStamp,
    durationDays,
  );
  
  // 返回解密后的值
  const decryptedValue = result[handle];
  return Number(decryptedValue);
}
```

### 步骤 2: 在 `useFHEVM.ts` 中添加解密方法

```typescript
const decryptCard = async (handle: string, contractAddr: string, userAddr: string, signer: any) => {
  if (!isInitialized) {
    throw new Error('FHEVM not initialized');
  }
  return decryptUint8(handle, contractAddr, userAddr, signer);
};

return {
  // ... 其他方法
  decryptCard,
};
```

### 步骤 3: 在 `ContractService.ts` 中修改 `getPlayerCards`

```typescript
/**
 * 读取玩家手牌(返回加密的 handle)
 */
async getPlayerCards(tableId: number): Promise<{ card1: string; card2: string }> {
  if (!this.contract) throw new Error('Contract 未初始化');

  const result = await this.contract.getPlayerCards(tableId);
  
  // result 是一个包含两个 euint8 的数组或对象
  // euint8 在 ethers.js 中会被转换为 bytes32 字符串
  return {
    card1: result[0] || result.card1,
    card2: result[1] || result.card2,
  };
}
```

### 步骤 4: 在 `GameNew.tsx` 中实现解密逻辑

```typescript
const [decryptedCards, setDecryptedCards] = useState<{ card1: number | null; card2: number | null }>({
  card1: null,
  card2: null,
});

// 在 loadGameInfo 函数中添加解密逻辑
useEffect(() => {
  const loadGameInfo = async () => {
    try {
      // ... 现有的加载逻辑
      
      // 加载手牌(加密的 handle)
      const playerCards = await contractService.getPlayerCards(tableId);
      console.log('🃏 加密的手牌 handles:', playerCards);
      
      // 解密手牌
      if (playerCards.card1 && playerCards.card2 && address) {
        try {
          const signer = await contractService.getSigner(); // 需要添加这个方法
          
          const card1Value = await fhevm.decryptCard(
            playerCards.card1,
            POKER_TABLE_ADDRESS,
            address,
            signer
          );
          
          const card2Value = await fhevm.decryptCard(
            playerCards.card2,
            POKER_TABLE_ADDRESS,
            address,
            signer
          );
          
          setDecryptedCards({ card1: card1Value, card2: card2Value });
          console.log('🔓 解密后的手牌:', { card1: card1Value, card2: card2Value });
        } catch (decryptErr) {
          console.error('❌ 解密手牌失败:', decryptErr);
          // 解密失败不影响其他功能
        }
      }
      
    } catch (err) {
      console.error('❌ 加载游戏信息失败:', err);
    }
  };
  
  loadGameInfo();
}, [tableId, address]);

// 修改手牌显示部分
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-lg font-bold text-gray-800 mb-4">🎴 你的手牌</h3>
  <div className="space-y-3 text-sm text-gray-600">
    {decryptedCards.card1 !== null && decryptedCards.card2 !== null ? (
      <div className="flex gap-4 justify-center">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center min-w-20">
          <div className="text-2xl font-bold text-blue-600">
            {cardIndexToString(decryptedCards.card1)}
          </div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center min-w-20">
          <div className="text-2xl font-bold text-blue-600">
            {cardIndexToString(decryptedCards.card2)}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-gray-400 text-center py-4">解密中...</div>
    )}
  </div>
</div>
```

### 步骤 5: 在 `ContractService.ts` 中添加 `getSigner` 方法

```typescript
/**
 * 获取 Signer 对象(用于签名解密请求)
 */
async getSigner(): Promise<any> {
  if (!this.provider) throw new Error('Provider 未初始化');
  return await this.provider.getSigner();
}
```

## 注意事项

### 1. 性能考虑

解密操作需要调用 Relayer 服务,可能需要几秒钟时间。建议:
- 显示"解密中..."加载状态
- 缓存解密结果,避免重复解密
- 解密失败时显示友好的错误提示

### 2. 错误处理

可能的错误:
- **ACL 权限不足**: 确保合约调用了 `FHE.allow(card, player.addr)`
- **Relayer 服务不可用**: 检查网络连接和 Relayer URL
- **签名失败**: 用户拒绝签名或钱包问题

### 3. 安全性

- 解密只在客户端进行,不会泄露给其他玩家
- 每次解密都需要用户签名授权
- 解密结果只在浏览器内存中,不会上链

## 替代方案:扑克牌图片

如果你想使用扑克牌图片而不是文字显示,可以:

1. **收集扑克牌图片** (52张,每张对应一个 0-51 的索引)
2. **创建映射函数**:

```typescript
function getCardImage(index: number): string {
  // 返回图片 URL
  return `/cards/card-${index}.png`;
}
```

3. **修改显示组件**:

```tsx
<img 
  src={getCardImage(decryptedCards.card1)} 
  alt={cardIndexToString(decryptedCards.card1)}
  className="w-20 h-28 rounded-lg shadow-lg"
/>
```

## 参考文档

- `dev.md` 第 4067-4151 行: 用户解密流程
- `dev.md` 第 4098-4101 行: ACL 权限要求
- [Zama Relayer SDK 文档](https://docs.zama.ai/protocol/relayer-sdk-guides)

## 下一步

1. ✅ 修复合约 ACL 权限(已完成)
2. ⏳ 重新部署合约
3. ⏳ 实现前端解密功能
4. ⏳ 测试手牌显示
5. ⏳ (可选)添加扑克牌图片

