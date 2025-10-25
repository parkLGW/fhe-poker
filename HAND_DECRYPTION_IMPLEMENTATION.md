# 手牌解密功能实现完成

## ✅ 已完成的工作

### 1. 合约修改

**文件**: `contracts/PokerTable.sol`

在 `joinTable` 函数中添加了手牌 ACL 权限:

```solidity
// 为卡牌设置 ACL 权限
FHE.allowThis(player.card1);
FHE.allowThis(player.card2);
// ✅ 允许玩家访问自己的手牌(用于解密)
FHE.allow(player.card1, msg.sender);
FHE.allow(player.card2, msg.sender);
```

**部署信息**:
- 合约地址: `0x282934Ff20556971e0D27a439969Bc4338307193`
- 网络: Sepolia 测试网
- Gas 使用: 2,631,446

---

### 2. 前端实现

#### 2.1 `fhevm.ts` - 添加解密函数

**文件**: `frontend/src/lib/fhevm.ts`

添加了 `decryptUint8` 函数:

```typescript
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

#### 2.2 `useFHEVM.ts` - 添加解密方法

**文件**: `frontend/src/hooks/useFHEVM.ts`

添加了 `decryptCard` 方法:

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

#### 2.3 `ContractService.ts` - 修改手牌获取

**文件**: `frontend/src/services/ContractService.ts`

修改了 `getPlayerCards` 方法,返回加密的 handle:

```typescript
async getPlayerCards(tableId: number): Promise<{ card1: string; card2: string }> {
  if (!this.contract) throw new Error('Contract 未初始化');

  const result = await this.contract.getPlayerCards(tableId);
  
  return {
    card1: result[0] || result.card1,
    card2: result[1] || result.card2,
  };
}

async getSigner(): Promise<ethers.Signer> {
  if (!this.signer) throw new Error('Signer 未初始化');
  return this.signer;
}
```

#### 2.4 `GameNew.tsx` - 实现解密逻辑

**文件**: `frontend/src/pages/GameNew.tsx`

添加了解密状态和逻辑:

```typescript
const [decryptedCards, setDecryptedCards] = useState<{ card1: number | null; card2: number | null }>({
  card1: null,
  card2: null,
});
const [isDecrypting, setIsDecrypting] = useState(false);

// 在 loadGameInfo 中添加解密逻辑
const cards = await contractService.getPlayerCards(tableId);

if (cards.card1 && cards.card2 && address && fhevm.isInitialized && !isDecrypting) {
  setIsDecrypting(true);
  try {
    const signer = await contractService.getSigner();

    const card1Value = await fhevm.decryptCard(
      cards.card1,
      POKER_TABLE_ADDRESS,
      address,
      signer
    );

    const card2Value = await fhevm.decryptCard(
      cards.card2,
      POKER_TABLE_ADDRESS,
      address,
      signer
    );

    setDecryptedCards({ card1: card1Value, card2: card2Value });
  } catch (decryptErr) {
    console.error('❌ 解密手牌失败:', decryptErr);
  } finally {
    setIsDecrypting(false);
  }
}
```

修改了手牌显示部分:

```tsx
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
    ) : isDecrypting ? (
      <div className="text-gray-400 text-center py-4">🔓 解密中...</div>
    ) : state.playerCards ? (
      <div className="text-gray-400 text-center py-4">🔐 加密的手牌</div>
    ) : (
      <div className="text-gray-400 text-center py-4">加载中...</div>
    )}
  </div>
</div>
```

---

## 🎮 测试步骤

1. **刷新浏览器页面** (http://localhost:5173)
2. **重新连接钱包**
3. **创建新游戏桌**
4. **加入游戏**
5. **开始游戏**
6. **观察手牌显示**:
   - 首先显示"加载中..."
   - 然后显示"🔓 解密中..."
   - 钱包会弹出签名请求(EIP-712 签名)
   - 签名后,手牌会显示为明文(如 `A♠`, `K♥`)

---

## 🔍 工作原理

### 解密流程

1. **获取加密的 handle**: 从合约读取 `euint8` 类型的手牌,返回 bytes32 handle
2. **生成临时密钥对**: 使用 FHEVM SDK 生成 NaCl 密钥对
3. **创建 EIP-712 签名**: 用户签名授权解密请求
4. **调用 Relayer**: 将 handle 和签名发送到 Relayer 服务
5. **Relayer 处理**: Relayer 使用 KMS 解密数据,然后用用户公钥重新加密
6. **客户端解密**: 使用临时私钥解密,得到明文值

### 安全性

- ✅ 解密只在客户端进行
- ✅ 每次解密都需要用户签名授权
- ✅ 解密结果只在浏览器内存中,不会上链
- ✅ 其他玩家无法看到你的手牌

---

## 📚 参考文档

- `dev.md` 第 4067-4151 行: 用户解密流程
- `dev.md` 第 4098-4101 行: ACL 权限要求
- [Zama Relayer SDK 文档](https://docs.zama.ai/protocol/relayer-sdk-guides)

---

## 🎉 总结

手牌解密功能已经完全实现!现在玩家可以:
1. ✅ 看到自己的手牌明文
2. ✅ 其他玩家无法看到你的手牌
3. ✅ 手牌在链上保持加密状态
4. ✅ 解密过程安全可靠

如果你想使用扑克牌图片而不是文字显示,可以:
1. 收集 52 张扑克牌图片(每张对应一个 0-51 的索引)
2. 创建映射函数 `getCardImage(index: number): string`
3. 修改显示组件使用 `<img>` 标签

需要我帮你实现扑克牌图片显示吗?

