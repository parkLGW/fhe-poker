# 游戏启动问题修复

## 问题分析

### 错误 1：跟注失败 - `0xbaf3f0f7` (InvalidState)
- **原因**：游戏状态不对，游戏还未开始

### 错误 2：加注失败 - `"Game has not started"`
- **原因**：合约中的 `bet()` 函数检查 `require(table.state != GameState.Waiting, "Game has not started")`
- 游戏状态仍然是 `Waiting` (0)

## 根本原因

**GameNew.tsx 中没有"开始游戏"按钮！**

- 玩家进入游戏后，无法开始游戏
- 游戏状态一直保持在 `Waiting` 状态
- 所以所有游戏操作（跟注、加注等）都会失败

## 解决方案

### 1. 添加"开始游戏"按钮
在 `GameNew.tsx` 中添加了：
- `isStartingGame` 状态变量
- `handleStartGame()` 函数
- 游戏操作面板中的"开始游戏"按钮

### 2. 改进游戏操作函数
为所有游戏操作函数添加了游戏状态检查：
- `handleCheck()` - 过牌
- `handleCall()` - 跟注
- `handleBet()` - 加注
- `handleFold()` - 弃牌

这样可以在执行操作前检查游戏是否已开始。

## 修改的文件

### `frontend/src/pages/GameNew.tsx`

**添加的内容：**

1. **状态变量**（第 39 行）
   ```typescript
   const [isStartingGame, setIsStartingGame] = useState(false);
   ```

2. **handleStartGame 函数**（第 141-160 行）
   ```typescript
   const handleStartGame = async () => {
     try {
       setIsStartingGame(true);
       setLoading(true);
       console.log('🎮 开始游戏:', { tableId });
       await contractService.startGame(tableId);
       console.log('✅ 游戏已开始');
       setError(null);
       setTimeout(() => {
         window.location.reload();
       }, 1000);
     } catch (err) {
       setError((err as Error).message);
       alert('开始游戏失败: ' + (err as Error).message);
     } finally {
       setIsStartingGame(false);
       setLoading(false);
     }
   };
   ```

3. **"开始游戏"按钮**（第 472-499 行）
   - **只有庄家（dealerIndex = 0）可以看到"开始游戏"按钮**
   - 其他玩家会看到"⏳ 等待庄家开始游戏..."的提示
   - 这样可以避免多个用户同时点击按钮

   ```typescript
   {gameState === 0 && playerCount >= 2 && (
     <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
       {(() => {
         const dealerIndex = state.tableInfo ? Number(state.tableInfo[5]) : null;
         const isDealer = myPlayerIndex !== null && dealerIndex !== null && myPlayerIndex === dealerIndex;

         if (isDealer) {
           return (
             <>
               <p className="text-yellow-800 font-semibold mb-3">⏳ 游戏还未开始，请点击下方按钮开始游戏</p>
               <button
                 onClick={handleStartGame}
                 disabled={isStartingGame || state.isLoading}
                 className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition"
               >
                 {isStartingGame ? '开始中...' : '🎮 开始游戏'}
               </button>
             </>
           );
         } else {
           return (
             <p className="text-yellow-800 font-semibold">⏳ 等待庄家开始游戏...</p>
           );
         }
       })()}
     </div>
   )}
   ```

4. **改进的游戏操作函数**
   - 所有操作函数（check、call、bet、fold）现在都会检查游戏状态
   - 如果游戏状态是 `Waiting` (0)，会显示错误信息："游戏还未开始，请等待游戏开始"
   - 如果游戏状态是 `Finished` (6)，会显示错误信息："游戏已结束，请创建新游戏"

## 使用流程

1. **进入游戏**
   - 从大厅选择游戏桌
   - 加入游戏（需要 >= 2 个玩家）

2. **开始游戏**
   - **庄家（第一个玩家）**会看到黄色的"开始游戏"按钮
   - **其他玩家**会看到"⏳ 等待庄家开始游戏..."的提示
   - 庄家点击按钮开始游戏
   - 页面会自动刷新

3. **游戏操作**
   - 游戏开始后，所有玩家都可以进行过牌、跟注、加注、弃牌等操作
   - 如果游戏还未开始，操作会显示错误信息

## 防止重复点击

- ✅ **只有庄家可以看到"开始游戏"按钮**
- ✅ **其他玩家只能看到等待提示**
- ✅ **避免了多个用户同时点击的问题**
- ✅ **确保游戏只被启动一次**

## 测试步骤

1. 打开浏览器，访问 `http://localhost:5173/`
2. 连接钱包（MetaMask）
3. 进入游戏大厅
4. 创建或加入游戏桌（需要 >= 2 个玩家）
5. 点击"开始游戏"按钮
6. 等待页面刷新
7. 测试游戏操作（过牌、跟注、加注、弃牌）

## 预期结果

- ✅ 过牌成功
- ✅ 跟注成功（不再报 `0xbaf3f0f7` 错误）
- ✅ 加注成功（不再报 "Game has not started" 错误）
- ✅ 弃牌成功

