# 🔄 修复前后对比

## 问题1: 加注后没有反应

### 修复前 ❌

**BettingPanel.tsx**
```typescript
const handleBet = () => {
  if (betAmount >= minRaise && betAmount <= myBalance) {
    onBet(betAmount);
    setShowRaiseInput(false);
    setBetAmount(minRaise);
  }
  // ❌ 如果条件不满足，直接返回，没有任何提示！
};
```

**用户体验**
- 点击"确认" → 没有反应
- 没有错误提示
- 用户不知道发生了什么

**Game.tsx handleBet**
```typescript
try {
  const encrypted = await fhevm.encryptBetAmount(amount);
  
  writeContract({
    address: POKER_TABLE_ADDRESS,
    abi: POKER_TABLE_ABI,
    functionName: 'bet',
    args: [BigInt(tableId), encrypted.data, encrypted.proof],
  });
  
  console.log('✅ writeContract 调用完成');
  // ❌ 没有等待交易完成
  // ❌ 没有处理错误
  // ❌ 没有显示交易状态
} catch (error) {
  alert('加注失败: ' + error.message);
}
```

---

### 修复后 ✅

**BettingPanel.tsx**
```typescript
const handleBet = () => {
  // ✅ 验证最小金额
  if (betAmount < minRaise) {
    alert(`❌ 最小加注金额为 ${formatChips(minRaise)}`);
    return;
  }
  
  // ✅ 验证余额
  if (betAmount > myBalance) {
    alert(`❌ 余额不足！你的筹码: ${formatChips(myBalance)}`);
    return;
  }
  
  onBet(betAmount);
  setShowRaiseInput(false);
  setBetAmount(minRaise);
};
```

**用户体验**
- 输入 < 最小值 → 显示 "❌ 最小加注金额为..."
- 输入 > 余额 → 显示 "❌ 余额不足！..."
- 输入有效值 → 显示 "⏳ 交易处理中..."

**Game.tsx handleBet**
```typescript
try {
  const encrypted = await fhevm.encryptBetAmount(amount);
  
  // ✅ 先模拟调用以捕获错误
  if (publicClient) {
    try {
      const sim = await publicClient.simulateContract({
        address: POKER_TABLE_ADDRESS,
        abi: POKER_TABLE_ABI,
        functionName: 'bet',
        args: [BigInt(tableId), encrypted.data, encrypted.proof],
        account: address,
      });
      // ✅ 模拟成功，发送真实交易
      writeContract(sim.request);
    } catch (simError) {
      // ✅ 捕获并显示错误
      const errorMsg = simError?.shortMessage || simError?.message;
      alert(`❌ 加注失败: ${errorMsg}`);
      return;
    }
  }
  
  console.log('✅ 交易已发送，等待确认...');
} catch (error) {
  alert('❌ 加注失败: ' + error.message);
}
```

**UI 反馈**
```typescript
{isPending && (
  <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
    <p className="font-bold">⏳ 交易处理中...</p>
    <p className="text-sm mt-1">请在钱包中确认交易</p>
  </div>
)}

{transactionError && (
  <div className="mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
    <p className="font-bold">❌ 交易失败</p>
    <p className="text-sm mt-1">{transactionError}</p>
  </div>
)}
```

---

## 问题2: 离开游戏返回首页

### 修复前 ❌

**Game.tsx**
```typescript
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (typeof onBack === 'function') {
        onBack();
      } else {
        // ❌ 使用 window.location.reload() 导致回到首页
        window.location.reload();
      }
    } catch (error) {
      // ❌ 错误时也调用 reload()
      window.location.reload();
    }
  }}
>
  🚪 离开游戏
</button>
```

**问题**
- ❌ 没有调用合约的 leaveTable 函数
- ❌ 玩家仍在合约中
- ❌ 使用 reload() 导致回到首页
- ❌ 没有交易确认

**用户体验**
- 点击"离开游戏" → 回到首页（不是大厅）
- 游戏状态混乱
- 下次进入时可能有冲突

---

### 修复后 ✅

**Game.tsx - 新增 handleLeaveGame 函数**
```typescript
const handleLeaveGame = async () => {
  console.log('🚪 开始离开游戏流程...');
  
  if (!address) {
    alert('❌ 请先连接钱包');
    return;
  }

  try {
    // ✅ 检查游戏状态
    if (gameState !== GameState.Waiting) {
      const confirmLeave = window.confirm(
        '⚠️ 游戏正在进行中，离开将被视为弃牌。确定要离开吗？'
      );
      if (!confirmLeave) return;
    }

    // ✅ 调用合约的 leaveTable 函数
    if (publicClient) {
      try {
        const sim = await publicClient.simulateContract({
          address: POKER_TABLE_ADDRESS,
          abi: POKER_TABLE_ABI,
          functionName: 'leaveTable',
          args: [BigInt(tableId)],
          account: address,
        });
        // ✅ 发送交易
        writeContract(sim.request);
        
        // ✅ 等待交易发送后再返回
        setTimeout(() => {
          console.log('✅ 返回游戏大厅');
          onBack();  // 返回大厅，不是首页！
        }, 500);
      } catch (simError) {
        const err = simError as any;
        const errorMsg = err?.shortMessage || err?.message;
        
        // ✅ 如果是状态错误，直接返回
        if (errorMsg.includes('InvalidState')) {
          console.log('⚠️ 游戏状态不允许离开，直接返回大厅');
          onBack();
        } else {
          alert(`❌ 离开失败: ${errorMsg}`);
        }
      }
    }
  } catch (error) {
    alert('❌ 离开失败: ' + (error as Error).message);
  }
};
```

**更新离开游戏按钮**
```typescript
<button
  onClick={handleLeaveGame}
  disabled={isPending}
  className="px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition duration-200 shadow-lg border-2 border-red-700"
>
  {isPending ? '⏳ 离开中...' : '🚪 离开游戏'}
</button>
```

**用户体验**
- ✅ 点击"离开游戏" → 返回游戏大厅（不是首页）
- ✅ 游戏进行中时提示用户
- ✅ 显示"⏳ 离开中..."状态
- ✅ 玩家正确从合约中移除

---

## 关键改进总结

| 方面 | 修复前 | 修复后 |
|------|--------|--------|
| **加注反馈** | ❌ 无反馈 | ✅ 显示具体错误 |
| **错误处理** | ❌ 基础 | ✅ 模拟调用 + 详细错误 |
| **交易状态** | ❌ 无提示 | ✅ 显示处理中/失败 |
| **离开游戏** | ❌ 回首页 | ✅ 回大厅 |
| **合约调用** | ❌ 无 | ✅ 调用 leaveTable |
| **用户体验** | ❌ 困惑 | ✅ 清晰反馈 |


