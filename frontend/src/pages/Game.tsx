import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { GameState } from '../lib/contract';
import { PlayerSeat } from '../components/game/PlayerSeat';
import { CommunityCards } from '../components/game/CommunityCards';
import { BettingPanel } from '../components/game/BettingPanel';
import { useFHEVM } from '../hooks/useFHEVM';
import { callBet, callLeaveTable, readTableInfo, readCommunityCards, readPlayerCards, readPlayerIndex, callFold, callCheck, callCall } from '../lib/ethers-contract';

interface GameProps {
  tableId: number;
  onBack: () => void;
  onLeaveGame: () => void;
}

export function Game({ tableId, onBack }: GameProps) {
  const [pot] = useState(0);
  const [communityCards, setCommunityCards] = useState<number[]>([]);
  const [playerCards, setPlayerCards] = useState<{ card1: string; card2: string } | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionError, setTransactionError] = useState<string>('');
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null);
  const fhevm = useFHEVM();
  const { address } = useAccount();

  // 调试：显示接收到的 tableId
  console.log('🎮 Game 组件接收到的 tableId:', tableId);

  // 先解析游戏桌信息 (按照合约getTableInfo的返回顺序)
  const gameState = tableInfo ? Number(tableInfo[0]) : GameState.Waiting;
  const playerCount = tableInfo ? Number(tableInfo[1]) : 0;
  const currentPlayerIndex = tableInfo ? Number(tableInfo[3]) : 0;
  const dealerIndex = tableInfo ? Number(tableInfo[4]) : 0;
  const smallBlindIndex = tableInfo ? Number(tableInfo[5]) : 0;
  const bigBlindIndex = tableInfo ? Number(tableInfo[6]) : 0;

  // 定期读取游戏桌信息
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const info = await readTableInfo(tableId);
        setTableInfo(info);
      } catch (error) {
        console.error('读取游戏桌信息失败:', error);
      }
    }, 5000); // 5秒轮询一次

    // 立即读取一次
    readTableInfo(tableId).then(setTableInfo).catch(console.error);

    return () => clearInterval(interval);
  }, [tableId]);

  // 定期读取玩家索引
  useEffect(() => {
    if (!address || gameState === GameState.Waiting) return;

    const interval = setInterval(async () => {
      try {
        const index = await readPlayerIndex(tableId, address);
        setMyPlayerIndex(Number(index));
      } catch (error) {
        console.error('读取玩家索引失败:', error);
      }
    }, 5000); // 5秒轮询一次

    // 立即读取一次
    readPlayerIndex(tableId, address).then(idx => setMyPlayerIndex(Number(idx))).catch(console.error);

    return () => clearInterval(interval);
  }, [tableId, address, gameState]);

  // 定期读取公共牌
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const cards = await readCommunityCards(tableId);
        const validCards = [...(cards as readonly number[])].filter(c => c > 0);
        setCommunityCards(validCards);
      } catch (error) {
        console.error('读取公共牌失败:', error);
      }
    }, 5000); // 5秒轮询一次

    // 立即读取一次
    readCommunityCards(tableId).then(cards => {
      const validCards = [...(cards as readonly number[])].filter(c => c > 0);
      setCommunityCards(validCards);
    }).catch(console.error);

    return () => clearInterval(interval);
  }, [tableId]);

  // 定期读取玩家手牌
  useEffect(() => {
    if (!address || gameState === GameState.Waiting) return;

    const interval = setInterval(async () => {
      try {
        const cards = await readPlayerCards(tableId);
        console.log('🃏 收到加密手牌:', cards);
        setPlayerCards({
          card1: cards[0] as string,
          card2: cards[1] as string,
        });
      } catch (error) {
        console.error('读取玩家手牌失败:', error);
      }
    }, 5000); // 5秒轮询一次

    // 立即读取一次
    readPlayerCards(tableId).then(cards => {
      console.log('🃏 收到加密手牌:', cards);
      setPlayerCards({
        card1: cards[0] as string,
        card2: cards[1] as string,
      });
    }).catch(console.error);

    return () => clearInterval(interval);
  }, [tableId, address, gameState]);


  // 操作函数
  const handleFold = async () => {
    if (!address) {
      alert('请连接钱包');
      return;
    }

    try {
      setTransactionStatus('pending');
      console.log('🃏 尝试弃牌:', { tableId, address, currentPlayerIndex, myPlayerIndex: Number(myPlayerIndex) });

      await callFold(tableId);
      setTransactionStatus('success');

      // 刷新游戏状态
      setTimeout(() => {
        readTableInfo(tableId).then(setTableInfo).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('弃牌失败:', error);
      setTransactionStatus('error');
      setTransactionError((error as Error).message);
      alert('弃牌失败: ' + (error as Error).message);
    }
  };

  const handleCheck = async () => {
    if (!address) {
      alert('请连接钱包');
      return;
    }

    try {
      setTransactionStatus('pending');
      console.log('🃏 尝试过牌:', {
        tableId,
        address,
        currentPlayerIndex,
        myPlayerIndex: Number(myPlayerIndex),
        isMyTurn: myPlayerIndex !== undefined && Number(myPlayerIndex) === currentPlayerIndex
      });

      await callCheck(tableId);
      setTransactionStatus('success');

      // 刷新游戏状态
      setTimeout(() => {
        readTableInfo(tableId).then(setTableInfo).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('过牌失败:', error);
      setTransactionStatus('error');
      setTransactionError((error as Error).message);
      alert('过牌失败: ' + (error as Error).message);
    }
  };

  const handleCall = async () => {
    if (!address) {
      alert('请连接钱包');
      return;
    }

    try {
      setTransactionStatus('pending');
      await callCall(tableId);
      setTransactionStatus('success');

      // 刷新游戏状态
      setTimeout(() => {
        readTableInfo(tableId).then(setTableInfo).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('跟注失败:', error);
      setTransactionStatus('error');
      setTransactionError((error as Error).message);
      alert('跟注失败: ' + (error as Error).message);
    }
  };

  const handleLeaveGame = async () => {
    console.log('🚪 开始离开游戏流程...');

    if (!address) {
      alert('❌ 请先连接钱包');
      return;
    }

    try {
      setTransactionStatus('pending');

      // 只有在游戏等待状态才能离开
      if (gameState !== GameState.Waiting) {
        const confirmLeave = window.confirm(
          '⚠️ 游戏正在进行中，离开将被视为弃牌。确定要离开吗？'
        );
        if (!confirmLeave) {
          setTransactionStatus('idle');
          return;
        }
      }

      // 使用 ethers.js 调用合约（按照 dev.md 的方式）
      console.log('📞 调用 callLeaveTable，tableId:', tableId);
      await callLeaveTable(tableId);

      console.log('✅ 离开游戏成功！');
      setTransactionStatus('success');

      // 延迟一下再返回，确保交易已确认
      setTimeout(() => {
        onBack();
      }, 500);
    } catch (error) {
      console.error('❌ 离开游戏失败:', error);
      setTransactionStatus('error');
      const errorMsg = (error as Error).message;

      // 如果是桌号不匹配的错误，提供强制返回选项
      if (errorMsg.includes('不在游戏中') || errorMsg.includes('玩家不在')) {
        const forceReturn = window.confirm(
          `❌ 无法从合约中离开游戏（${errorMsg}）\n\n是否强制返回大厅？\n\n注意：这可能会导致你的账户被锁定在游戏中。`
        );
        if (forceReturn) {
          console.log('⚠️ 强制返回大厅');
          onBack();
        }
      } else {
        alert(`❌ 离开失败: ${errorMsg}`);
      }
    } finally {
      setTransactionStatus('idle');
    }
  };

  const handleBet = async (amount: number) => {
    console.log('🎯 开始处理加注:', { amount, tableId, address });

    // 前置检查
    if (!fhevm.isInitialized) {
      console.error('❌ FHEVM not initialized');
      alert('❌ FHEVM未初始化，请等待初始化完成');
      return;
    }

    if (!address) {
      console.error('❌ No wallet address');
      alert('❌ 请先连接钱包');
      return;
    }

    // 检查是否轮到自己
    if (myPlayerIndex === undefined || Number(myPlayerIndex) !== currentPlayerIndex) {
      console.error('❌ Not your turn!', {
        myPlayerIndex: myPlayerIndex !== undefined ? Number(myPlayerIndex) : 'undefined',
        currentPlayerIndex
      });
      alert(`❌ 不是你的回合！当前轮到玩家 ${currentPlayerIndex}，你是玩家 ${myPlayerIndex !== undefined ? Number(myPlayerIndex) : '未知'}`);
      return;
    }

    try {
      console.log('🔐 开始加密下注金额:', amount);

      // 使用FHEVM加密下注金额
      const encrypted = await fhevm.encryptBetAmount(amount);
      console.log('✅ 加密完成:', {
        dataType: typeof encrypted.encryptedAmount,
        dataIsUint8Array: encrypted.encryptedAmount instanceof Uint8Array,
        dataLength: encrypted.encryptedAmount?.length,
        proofType: typeof encrypted.inputProof,
        proofIsUint8Array: encrypted.inputProof instanceof Uint8Array,
        proofLength: encrypted.inputProof?.length,
      });

      // 使用 ethers.js 调用合约（按照 dev.md 的方式）
      // ethers.js 会自动处理 Uint8Array 的序列化
      await callBet(tableId, encrypted.encryptedAmount, encrypted.inputProof);

      console.log('✅ 加注成功！');
      alert('✅ 加注成功！');

      // 刷新游戏状态
      setTimeout(() => {
        readTableInfo(tableId).then(setTableInfo).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('❌ 加注失败:', error);
      const errorMsg = (error as Error).message;
      alert(`❌ 加注失败: ${errorMsg}`);
    }
  };

  // 模拟玩家数据 (实际应从合约读取)
  const mockPlayers = Array.from({ length: Number(playerCount) }, (_, i) => ({
    address: i === 0 ? (address || `0x${i.toString().padStart(40, '0')}`) : `0x${i.toString().padStart(40, '0')}`,
    balance: 1000,
    currentBet: 0,
    isActive: true,
    hasFolded: false,
    lastAction: 0,
    // 只有在游戏已开始时才显示手牌，否则显示空数组（会显示为牌背）
    cards: i === 0 && gameState !== GameState.Waiting ? [0, 13] : [],
    encryptedCards: i === 0 ? playerCards : null, // 显示加密手牌信息
  }));

  // 座位布局 (6人桌)
  const seatPositions = [
    'bottom',    // 0 - 玩家自己
    'left',      // 1
    'top',       // 2
    'top',       // 3
    'top',       // 4
    'right',     // 5
  ];

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* 顶部栏 */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <div className="glass-effect rounded-2xl shadow-2xl p-5 flex items-center justify-between border-2 border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎴</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span>游戏桌</span>
                <span className="text-yellow-400">#{tableId}</span>
              </h2>
              <p className="text-sm text-white/70 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>玩家: {playerCount}/6</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleLeaveGame}
            disabled={transactionStatus === 'pending'}
            className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            style={{ zIndex: 9999 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center gap-2">
              <span className="text-xl">{transactionStatus === 'pending' ? '⏳' : '🚪'}</span>
              <span>{transactionStatus === 'pending' ? '离开中...' : '离开游戏'}</span>
            </span>
          </button>
        </div>
      </div>

      {/* 游戏桌主区域 */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="relative glass-effect rounded-[3rem] shadow-2xl p-10 border-4 border-amber-700/50">
          {/* 椭圆形桌面边框 - 多层效果 */}
          <div className="absolute inset-6 border-4 border-amber-600/30 rounded-[50%] opacity-40" />
          <div className="absolute inset-8 border-2 border-amber-500/20 rounded-[50%] opacity-30" />

          {/* 桌面中心装饰 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>

          {/* 当前玩家提示 - 显示在桌面顶部 */}
          {gameState !== GameState.Waiting && gameState !== GameState.Finished && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
              {myPlayerIndex !== null && myPlayerIndex === currentPlayerIndex ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl animate-pulse border-2 border-green-300">
                    <span className="text-lg font-black flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <span>轮到你了！请选择操作</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-50"></div>
                  <div className="relative glass-effect px-8 py-4 rounded-full shadow-2xl border-2 border-blue-300/50">
                    <span className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-2xl">⏳</span>
                      <span>等待玩家 #{currentPlayerIndex + 1} 操作...</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 玩家座位布局 */}
          <div className="relative h-[600px]">
            {/* 中央 - 公共牌和奖池 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <CommunityCards
                cards={communityCards}
                pot={pot}
                gameState={gameState}
              />
            </div>

            {/* 玩家座位 */}
            {mockPlayers.map((player, index) => {
              const position = seatPositions[index] as 'top' | 'left' | 'right' | 'bottom';
              let positionClass = '';

              switch (position) {
                case 'bottom':
                  positionClass = 'absolute bottom-0 left-1/2 transform -translate-x-1/2';
                  break;
                case 'top':
                  if (index === 2) positionClass = 'absolute top-0 left-1/4 transform -translate-x-1/2';
                  else if (index === 3) positionClass = 'absolute top-0 left-1/2 transform -translate-x-1/2';
                  else positionClass = 'absolute top-0 right-1/4 transform translate-x-1/2';
                  break;
                case 'left':
                  positionClass = 'absolute left-0 top-1/2 transform -translate-y-1/2';
                  break;
                case 'right':
                  positionClass = 'absolute right-0 top-1/2 transform -translate-y-1/2';
                  break;
              }

              return (
                <div key={index} className={positionClass}>
                  <PlayerSeat
                    address={player.address}
                    balance={player.balance}
                    currentBet={player.currentBet}
                    isActive={player.isActive}
                    hasFolded={player.hasFolded}
                    isCurrentPlayer={index === currentPlayerIndex}
                    isDealer={index === dealerIndex}
                    isSmallBlind={index === smallBlindIndex}
                    isBigBlind={index === bigBlindIndex}
                    lastAction={player.lastAction}
                    cards={player.cards}
                    showCards={index === 0} // 只显示自己的牌
                    position={position}
                    gameStarted={gameState !== GameState.Waiting} // 传递游戏是否已开始
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部 - 操作面板 */}
        <div className="mt-6 max-w-2xl mx-auto">
          <BettingPanel
            isMyTurn={myPlayerIndex !== undefined && Number(myPlayerIndex) === currentPlayerIndex}
            myBalance={1000}
            currentBet={0}
            minRaise={20}
            onFold={handleFold}
            onCheck={handleCheck}
            onCall={handleCall}
            onBet={handleBet}
            disabled={transactionStatus === 'pending'}
          />

          {/* 交易状态提示 */}
          {transactionStatus === 'pending' && (
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
        </div>
      </div>

      {/* FHEVM状态和调试信息 */}
      <div className="fixed bottom-6 right-6 glass-effect rounded-2xl shadow-2xl p-5 text-xs max-w-sm space-y-3 border-2 border-white/20 z-50">
        {/* FHEVM状态 */}
        <div className="border-b border-white/20 pb-3">
          <div className="font-black mb-2 text-white flex items-center gap-2">
            <span className="text-lg">🔐</span>
            <span>FHEVM Status</span>
          </div>
          <div className={`font-bold ${fhevm.isInitialized ? 'text-green-400' : 'text-yellow-400'}`}>
            {fhevm.isInitializing ? '⏳ Initializing...' :
             fhevm.isInitialized ? '✅ Ready' :
             fhevm.error ? '❌ Error' : '⏸️ Not Started'}
          </div>
          {fhevm.error && (
            <div className="text-red-400 mt-2 p-2 bg-red-500/10 rounded-lg border border-red-400/30">
              {fhevm.error.message}
            </div>
          )}
        </div>

        {/* 游戏信息 */}
        <div className="space-y-1.5">
          <div className="font-black mb-2 text-white flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <span>Game Info</span>
          </div>
          <div className="text-white/80"><span className="text-white/60">State:</span> <span className="font-bold">{gameState}</span></div>
          <div className="text-white/80"><span className="text-white/60">Players:</span> <span className="font-bold">{playerCount}</span></div>
          <div className="text-white/80"><span className="text-white/60">Current:</span> <span className="font-bold">{currentPlayerIndex}</span></div>
          <div className="text-white/80"><span className="text-white/60">Cards:</span> <span className="font-bold">{communityCards.length}</span></div>
          <div className="text-white/80"><span className="text-white/60">My Address:</span> <span className="font-mono font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
          <div className="text-white/80"><span className="text-white/60">My Index:</span> <span className="font-bold">{myPlayerIndex !== undefined ? Number(myPlayerIndex) : 'Loading...'}</span></div>
          <div className={`font-bold p-2 rounded-lg ${myPlayerIndex !== undefined && Number(myPlayerIndex) === currentPlayerIndex ? 'bg-green-500/20 text-green-400 border border-green-400/30' : 'bg-red-500/20 text-red-400 border border-red-400/30'}`}>
            Is My Turn: {myPlayerIndex !== undefined && Number(myPlayerIndex) === currentPlayerIndex ? '✅ YES' : '❌ NO'}
          </div>
          <div className="text-white/80"><span className="text-white/60">Turn Status:</span> <span className="font-bold">Player {currentPlayerIndex} should act</span></div>
        </div>

        {/* 手牌信息 */}
        {playerCards && (
          <div className="border-t border-white/20 pt-3">
            <div className="font-black mb-2 text-white flex items-center gap-2">
              <span className="text-lg">🃏</span>
              <span>My Cards (Encrypted)</span>
            </div>
            <div className="space-y-1.5 text-white/70 font-mono">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <div className="text-white/50 text-[10px] mb-1">Card 1:</div>
                <div className="truncate">{playerCards.card1.slice(0, 20)}...</div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <div className="text-white/50 text-[10px] mb-1">Card 2:</div>
                <div className="truncate">{playerCards.card2.slice(0, 20)}...</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
