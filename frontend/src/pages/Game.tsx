/**
 * 游戏页面 - 重新设计版本
 * 职责：显示游戏状态，处理用户操作
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { contractService } from '../services/ContractService';
import { useFHEVM } from '../hooks/useFHEVM';
import { useGameStore } from '../store/gameStore.tsx';
import { POKER_TABLE_ADDRESS } from '../lib/contract';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';

interface GameProps {
  tableId: number;
  onBack: () => void;
}

// 卡牌花色和点数
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 判断花色颜色
function getSuitColor(suit: string): string {
  return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-900';
}

// 扑克牌组件 - 支持不同尺寸
function PokerCard({ card, isHidden = false, size = 'normal' }: { card?: number | null; isHidden?: boolean; size?: 'normal' | 'large' }) {
  // 根据尺寸设置不同的样式 - 使用内联样式确保生效
  const sizeStyle = size === 'large'
    ? { width: '6rem', height: '9rem' }    // 大尺寸：96px x 144px
    : { width: '4rem', height: '6rem' };   // 普通尺寸：64px x 96px (w-16 h-24)

  const textSizes = size === 'large'
    ? { corner: 'text-sm', suit: 'text-xl', center: 'text-5xl', back: 'text-4xl' }
    : { corner: 'text-[0.5rem]', suit: 'text-xs', center: 'text-2xl', back: 'text-2xl' };

  if (isHidden || card === null || card === undefined) {
    return (
      <div style={sizeStyle} className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-900 shadow-lg transform hover:scale-105 transition-transform">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.1)_3px,rgba(255,255,255,0.1)_6px)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${textSizes.back} text-white opacity-50`}>🂠</div>
        </div>
      </div>
    );
  }

  const numIndex = typeof card === 'bigint' ? Number(card) : Number(card || 0);
  // 卡牌索引现在是 1-52，转换为 0-51
  const cardIndex = numIndex - 1;
  const suit = SUITS[Math.floor(cardIndex / 13)];
  const rank = RANKS[cardIndex % 13];
  const colorClass = getSuitColor(suit);

  // 简化设计：只在中间显示点数和花色
  return (
    <div style={sizeStyle} className={`bg-white rounded-lg border-2 border-gray-300 shadow-lg transform hover:scale-105 transition-transform flex flex-col items-center justify-center ${colorClass}`}>
      <div className="text-lg font-bold leading-tight">{rank}</div>
      <div className="text-2xl leading-tight">{suit}</div>
    </div>
  );
}

export function Game({ tableId, onBack }: GameProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const fhevm = useFHEVM();
  const { state, setTableInfo, setPlayerCards, setCommunityCards, setLoading, setError } = useGameStore();

  const [isLeavingGame, setIsLeavingGame] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [decryptedCards, setDecryptedCards] = useState<{ card1: number | null; card2: number | null }>({
    card1: null,
    card2: null,
  });
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [pendingDecryption, setPendingDecryption] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ winnerIndex: number; winnerAddress: string } | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasRevealedCards, setHasRevealedCards] = useState(false);
  const [previousGameState, setPreviousGameState] = useState<number | null>(null);
  const [playersInfo, setPlayersInfo] = useState<{
    players: string[];
    playerBets: bigint[];
    playerFolded: boolean[];
    currentPlayerIndex: number;
    pot: bigint;
    dealerIndex: number;
  } | null>(null);

  // 加载游戏信息 - 使用 useCallback 以便在其他地方调用
  const loadGameInfo = useCallback(async (showLoading = false) => {
      try {
        // 只在首次加载或明确要求时显示 loading
        if (showLoading) {
          setLoading(true);
        }

        // 确保合约服务已初始化
        await contractService.initialize();

        // 获取当前玩家地址
        const playerAddress = await contractService.getPlayerAddress();

        // 检查玩家是否在游戏中
        try {
          const playerTableId = await contractService.getPlayerTable(playerAddress);
          const expectedTableId = tableId + 1; // 合约中存储的是 tableId + 1

          if (playerTableId === 0) {
            // 前3次尝试时，不立即返回，可能是网络延迟
            if (loadAttempts < 3) {
              setLoadAttempts(loadAttempts + 1);
            } else {
              setError('玩家未加入游戏桌。请返回大厅重新加入。');
              setLoading(false);
              return;
            }
          } else if (playerTableId !== expectedTableId) {
            const actualTableId = playerTableId - 1;
            setError(`玩家在桌子 ${actualTableId} 中，不是当前桌子 ${tableId}`);
            setLoading(false);
            return;
          } else {
            setLoadAttempts(0); // 重置计数器
          }
        } catch (err) {
          // 继续加载，可能是网络问题
        }

        // 加载游戏桌信息
        const tableInfo = await contractService.getTableInfo(tableId);
        setTableInfo(tableInfo);

        // 加载游戏桌完整信息（包括玩家和奖池）
        try {
          const playersData = await contractService.getTableInfoWithPlayers(tableId);
          setPlayersInfo(playersData);
        } catch (err) {
          console.error('❌ 无法加载玩家信息:', err);
        }

        // 获取当前玩家的座位索引
        try {
          const playerIndex = await contractService.getPlayerIndex(tableId, playerAddress);
          setMyPlayerIndex(playerIndex);
        } catch (err) {
          console.error('❌ 无法获取玩家座位索引:', err);
          setError('无法获取玩家座位信息，请刷新页面重试');
        }

        // 加载玩家手牌(加密的 handle)
        try {
          const cards = await contractService.getPlayerCards(tableId);
          setPlayerCards(cards);

          // 检查是否有新的手牌需要解密
          // 如果手牌 handle 存在，且当前没有解密值或解密值为空，则标记需要解密
          const hasNewCards = cards.card1 && cards.card2;
          const needsDecryption = decryptedCards.card1 === null || decryptedCards.card2 === null;

          if (hasNewCards && needsDecryption) {
            setPendingDecryption(true);
          }
        } catch (err) {
          console.error('❌ 无法读取手牌:', err);
          // 不中断加载，继续加载其他信息
        }

        // 加载公共牌
        const communityCards = await contractService.getCommunityCards(tableId);
        setCommunityCards(communityCards);

        // 如果游戏已结束,加载获胜者信息
        const gameState = tableInfo ? Number(tableInfo[0]) : 0;
        if (gameState === 6) {
          try {
            const winner = await contractService.getWinner(tableId);
            setWinnerInfo(winner);
          } catch (err) {
            // 忽略获胜者信息加载失败
          }
        }

        // 如果在 Showdown 阶段，检查玩家是否已经公开手牌
        if (gameState === 5 && myPlayerIndex !== null) {
          try {
            const revealed = await contractService.hasPlayerRevealedCards(tableId, myPlayerIndex);
            setHasRevealedCards(revealed);
          } catch (err) {
            console.warn('⚠️ 无法检查手牌公开状态:', err);
          }
        }

        setError(null);
      } catch (err) {
        console.error('❌ 加载游戏信息失败:', err);
        setError((err as Error).message);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
  }, [tableId, loadAttempts, decryptedCards, setLoading, setError, setTableInfo, setPlayerCards, setCommunityCards]);

  // 定时轮询游戏信息
  useEffect(() => {
    // 首次加载显示 loading
    if (isInitialLoad) {
      loadGameInfo(true);
      setIsInitialLoad(false);
    } else {
      loadGameInfo(false);
    }

    // 轮询时不显示 loading
    const interval = setInterval(() => loadGameInfo(false), 1000);
    return () => clearInterval(interval);
  }, [loadGameInfo, isInitialLoad]);

  // 当 FHEVM 初始化完成且有待解密的手牌时，执行解密
  useEffect(() => {
    const decryptCards = async () => {
      // 如果已经解密成功，不再重复解密
      if (decryptedCards.card1 !== null && decryptedCards.card2 !== null) {
        return;
      }

      if (!pendingDecryption) {
        return;
      }

      if (!fhevm.isInitialized) {
        return;
      }

      if (!address) {
        return;
      }

      if (!state.playerCards || !state.playerCards.card1 || !state.playerCards.card2) {
        return;
      }

      if (isDecrypting) {
        return;
      }

      setIsDecrypting(true);
      setPendingDecryption(false);

      try {
        const signer = await contractService.getSigner();

        // 批量解密两张牌,只需要签名一次!
        const [card1Value, card2Value] = await fhevm.decryptCards(
          [state.playerCards.card1, state.playerCards.card2],
          POKER_TABLE_ADDRESS,
          address,
          signer
        );

        setDecryptedCards({ card1: card1Value, card2: card2Value });
      } catch (decryptErr) {
        console.error('❌ 解密手牌失败:', decryptErr);
        // 解密失败后，允许重试
        setPendingDecryption(true);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptCards();
  }, [fhevm.isInitialized, pendingDecryption, address, state.playerCards, isDecrypting, decryptedCards]);

  // 监听游戏状态变化，当游戏开始时重置解密状态
  useEffect(() => {
    const currentGameState = state.tableInfo ? Number(state.tableInfo[0]) : null;

    // 如果游戏状态从 Waiting(0) 变为 PreFlop(1)，说明游戏刚开始，需要重置解密状态
    if (previousGameState === 0 && currentGameState === 1) {
      setDecryptedCards({ card1: null, card2: null });
      setHasRevealedCards(false);
      setPendingDecryption(false); // 先重置，等待 loadGameInfo 重新设置
    }

    // 更新上一次的游戏状态
    if (currentGameState !== null) {
      setPreviousGameState(currentGameState);
    }
  }, [state.tableInfo, previousGameState]);

  const handleStartGame = async () => {
    try {
      setIsStartingGame(true);
      setLoading(true);

      await contractService.startGame(tableId);
      setError(null);

      // 重新加载游戏信息，而不是刷新整个页面
      setTimeout(() => {
        loadGameInfo();
      }, 1000);
    } catch (err) {
      setError((err as Error).message);
      alert('开始游戏失败: ' + (err as Error).message);
    } finally {
      setIsStartingGame(false);
      setLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!window.confirm('确定要离开游戏吗？')) {
      return;
    }

    try {
      setIsLeavingGame(true);
      setLoading(true);

      await contractService.leaveTable(tableId);
      onBack();
    } catch (err) {
      setError((err as Error).message);
      alert('离开失败: ' + (err as Error).message);
    } finally {
      setIsLeavingGame(false);
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    try {
      setActionInProgress(true);
      setLoading(true);

      // 检查游戏状态
      const tableInfo = await contractService.getTableInfo(tableId);
      if (tableInfo.state === 0) {
        throw new Error('游戏还未开始，请等待游戏开始');
      }
      if (tableInfo.state === 6) {
        throw new Error('游戏已结束，请创建新游戏');
      }

      await contractService.check(tableId);
      setError(null);

      // 立即刷新游戏状态
      await loadGameInfo();
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      alert('过牌失败: ' + errorMsg);
    } finally {
      setActionInProgress(false);
      setLoading(false);
    }
  };

  const handleCall = async () => {
    try {
      setActionInProgress(true);
      setLoading(true);

      // 检查游戏状态
      const tableInfo = await contractService.getTableInfo(tableId);

      if (tableInfo.state === 0) {
        throw new Error('游戏还未开始，请等待游戏开始');
      }

      if (tableInfo.state === 6) {
        throw new Error('游戏已结束，请创建新游戏');
      }

      await contractService.call(tableId);
      setError(null);

      // 立即刷新游戏状态
      await loadGameInfo();
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      alert('跟注失败: ' + errorMsg);
    } finally {
      setActionInProgress(false);
      setLoading(false);
    }
  };

  const handleBet = async () => {
    const amountStr = prompt('请输入下注金额:');
    if (!amountStr) return;

    try {
      setActionInProgress(true);
      setLoading(true);

      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('请输入有效的金额');
      }

      // 检查玩家是否在游戏中
      const playerAddress = address;
      if (!playerAddress) {
        throw new Error('未连接钱包');
      }

      // 重新加载游戏信息，确保状态是最新的
      const tableInfo = await contractService.getTableInfo(tableId);

      if (tableInfo.state === 0) {
        throw new Error('游戏还未开始，请等待游戏开始');
      }

      if (tableInfo.state === 6) {
        throw new Error('游戏已结束，请创建新游戏');
      }

      // 加密下注金额
      const encrypted = await fhevm.encryptBetAmount(amount);

      // 调用合约
      await contractService.bet(tableId, amount, encrypted.encryptedAmount, encrypted.inputProof);

      setError(null);

      // 立即刷新游戏状态
      await loadGameInfo();
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      alert('下注失败: ' + errorMsg);
    } finally {
      setActionInProgress(false);
      setLoading(false);
    }
  };

  const handleFold = async () => {
    try {
      setActionInProgress(true);
      setLoading(true);

      // 检查游戏状态
      const tableInfo = await contractService.getTableInfo(tableId);
      if (tableInfo.state === 0) {
        throw new Error('游戏还未开始，请等待游戏开始');
      }
      if (tableInfo.state === 6) {
        throw new Error('游戏已结束，请创建新游戏');
      }

      await contractService.fold(tableId);
      setError(null);

      // 立即刷新游戏状态
      await loadGameInfo();
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      alert('弃牌失败: ' + errorMsg);
    } finally {
      setActionInProgress(false);
      setLoading(false);
    }
  };

  const gameState = state.tableInfo ? Number(state.tableInfo[0]) : 0;
  const playerCount = state.tableInfo ? Number(state.tableInfo[1]) : 0;
  const smallBlind = state.tableInfo ? Number(state.tableInfo[8]) : 0;
  const bigBlind = state.tableInfo ? Number(state.tableInfo[9]) : 0;
  const pot = playersInfo ? Number(playersInfo.pot) : 0;

  const getStateName = (state: number): string => {
    const stateKeys: { [key: number]: string } = {
      0: 'game.states.waiting',
      1: 'game.states.preflop',
      2: 'game.states.flop',
      3: 'game.states.turn',
      4: 'game.states.river',
      5: 'game.states.showdown',
      6: 'game.states.ended'
    };
    return t(stateKeys[state] || 'game.states.waiting');
  };

  // 加载状态
  if (state.isLoading && !state.tableInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">加载游戏中...</h2>
          <p className="text-gray-600">正在获取游戏信息，请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* 头部信息栏 */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-2xl p-4 mb-4 border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg">
                {t('game.table_number', { number: tableId })}
              </div>
              <div className="text-white">
                <div className="text-sm text-slate-300">{t('game.game_state')}</div>
                <div className="font-bold text-lg">{getStateName(gameState)}</div>
              </div>
              <div className="text-white">
                <div className="text-sm text-slate-300">{t('lobby.players')}</div>
                <div className="font-bold text-lg">{playerCount}/6</div>
              </div>
              <div className="text-white">
                <div className="text-sm text-slate-300">{t('lobby.blinds')}</div>
                <div className="font-bold text-lg">{smallBlind}/{bigBlind}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={handleLeaveGame}
                disabled={isLeavingGame || state.isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-all"
              >
                {isLeavingGame ? t('game.leaving') : `🚪 ${t('game.leave_game')}`}
              </button>
            </div>
          </div>
        </div>

        {/* 扑克桌主区域 */}
        <div className="relative">
          {/* 扑克桌 */}
          <div className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 rounded-[50%] shadow-2xl border-8 border-amber-900 p-12 mx-auto" style={{ maxWidth: '900px', aspectRatio: '16/10' }}>
            {/* 桌面内边框 */}
            <div className="absolute inset-8 border-4 border-amber-700 rounded-[50%] opacity-50"></div>

            {/* 奖池区域 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-yellow-500 shadow-xl">
                <div className="text-yellow-400 text-sm font-semibold mb-1">💰 {t('game.pot')}</div>
                <div className="text-white text-2xl font-bold">{pot}</div>
              </div>
            </div>

            {/* 公共牌区域 - 使用普通尺寸卡牌 (w-16 h-24) */}
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const card = state.communityCards?.[idx];
                  const isRevealed = card !== undefined && card !== null && Number(card) !== 0;
                  return (
                    <PokerCard key={idx} card={isRevealed ? card : null} isHidden={!isRevealed} />
                  );
                })}
              </div>
            </div>

            {/* 玩家座位 - 环绕桌子 */}
            {playersInfo && (() => {
              const players = playersInfo.players || [];
              const playerBets = playersInfo.playerBets || [];
              const playerFolded = playersInfo.playerFolded || [];
              const currentPlayerIndex = playersInfo.currentPlayerIndex;
              const dealerIndex = playersInfo.dealerIndex;

              // 座位位置配置 (6个座位环绕桌子)
              const seatPositions = [
                { top: '85%', left: '50%', transform: 'translate(-50%, -50%)' }, // 底部中间 (玩家自己)
                { top: '70%', left: '10%', transform: 'translate(-50%, -50%)' }, // 左下
                { top: '35%', left: '5%', transform: 'translate(-50%, -50%)' },  // 左上
                { top: '10%', left: '50%', transform: 'translate(-50%, -50%)' }, // 顶部中间
                { top: '35%', left: '95%', transform: 'translate(-50%, -50%)' }, // 右上
                { top: '70%', left: '90%', transform: 'translate(-50%, -50%)' }, // 右下
              ];

              return seatPositions.map((pos, idx) => {
                const player = players[idx];
                const isOccupied = player && player !== '0x0000000000000000000000000000000000000000';
                const isCurrentPlayer = idx === currentPlayerIndex;
                const isDealer = idx === dealerIndex;
                const isFolded = playerFolded[idx];
                const bet = playerBets[idx] ? Number(playerBets[idx]) : 0;
                const isMe = address && player && player.toLowerCase() === address.toLowerCase();

                return (
                  <div
                    key={idx}
                    className="absolute"
                    style={pos}
                  >
                    {isOccupied ? (
                      <div className="relative">
                        {/* 当前玩家的发光效果 */}
                        {isCurrentPlayer && (
                          <div className="absolute -inset-2 bg-yellow-400 rounded-lg opacity-50 blur-md animate-pulse"></div>
                        )}

                        {/* 玩家信息卡片 */}
                        <div className={`relative bg-gradient-to-br ${isMe ? 'from-blue-600 to-blue-800' : 'from-slate-700 to-slate-800'} rounded-lg shadow-xl border-4 ${isCurrentPlayer ? 'border-yellow-400 shadow-yellow-400/50' : 'border-slate-600'} min-w-32 transition-all duration-300 p-3`}>
                          {/* 当前玩家指示器 - 放在卡片内部顶部 */}
                          {isCurrentPlayer && (
                            <div className="mb-2 bg-yellow-400 text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap text-center" style={{ color: '#00ff00' }}>
                              ⏰ {t('game.player_status.in_action')}
                            </div>
                          )}

                          {/* 玩家地址 */}
                          <div className={`!text-white text-xs font-mono mb-2 ${isCurrentPlayer ? 'font-bold' : ''}`} style={{ color: '#ffffff' }}>
                            {isMe ? `👤 ${t('game.player_status.you')}` : `${player.slice(0, 6)}...${player.slice(-4)}`}
                          </div>

                          {/* 状态 */}
                          <div className="flex items-center justify-between">
                            <div className={`text-xs font-semibold !text-white`} style={{ color: '#ffffff' }}>
                              {isFolded ? t('game.player_status.folded') : t('game.player_status.active')}
                            </div>
                            {bet > 0 && (
                              <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                                {bet}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 庄家标记 - 放在卡片外部下方 */}
                        {isDealer && (
                          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10">
                            D
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-800 bg-opacity-50 rounded-lg p-3 border-2 border-dashed border-slate-600 min-w-32">
                        <div className="!text-white text-xs text-center" style={{ color: '#ffffff' }}>{t('game.empty_seat')}</div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* 你的手牌 - 显示在桌子下方，使用普通尺寸卡牌 (w-16 h-24) */}
          <div className="mt-6 flex justify-center">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-2xl border-2 border-slate-600">
              <div className="text-white text-lg font-semibold mb-4 text-center">🎴 {t('game.your_hand')}</div>
              <div className="flex gap-6 justify-center">
                {gameState === 0 ? (
                  // 游戏未开始，显示牌背
                  <>
                    <PokerCard isHidden />
                    <PokerCard isHidden />
                  </>
                ) : decryptedCards.card1 !== null && decryptedCards.card2 !== null ? (
                  // 已解密，显示明牌
                  <>
                    <PokerCard card={decryptedCards.card1} />
                    <PokerCard card={decryptedCards.card2} />
                  </>
                ) : isDecrypting ? (
                  // 解密中
                  <>
                    <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center animate-pulse">
                      <div className="text-white text-xs">{t('game.decrypting')}</div>
                    </div>
                    <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center animate-pulse">
                      <div className="text-white text-xs">{t('game.decrypting')}</div>
                    </div>
                  </>
                ) : state.playerCards ? (
                  // 有加密手牌，显示牌背
                  <>
                    <PokerCard isHidden />
                    <PokerCard isHidden />
                  </>
                ) : (
                  // 其他情况（不应该出现）
                  <>
                    <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center">
                      <div className="text-slate-500 text-xs">{t('game.waiting')}</div>
                    </div>
                    <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center">
                      <div className="text-slate-500 text-xs">{t('game.waiting')}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {state.error && (
          <div className="mt-4 bg-red-900 bg-opacity-90 border-l-4 border-red-500 text-red-100 p-4 rounded-lg shadow-lg">
            <p className="font-bold">❌ 错误</p>
            <p className="text-sm mt-1">{state.error}</p>
          </div>
        )}

        {/* 游戏操作面板 */}
        <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border-2 border-slate-700">

          {/* 游戏结束 - 显示获胜信息 */}
          {gameState === 6 && (
            <div className="mb-6 p-8 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-2xl shadow-2xl border-4 border-yellow-400">
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce">🏆</div>
                <h4 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">游戏结束!</h4>
                {winnerInfo && winnerInfo.winnerIndex !== 255 ? (
                  <div>
                    {address && winnerInfo.winnerAddress.toLowerCase() === address.toLowerCase() ? (
                      <>
                        <p className="text-3xl font-bold text-green-900 mb-3 animate-pulse">🎉 恭喜你获胜!</p>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 inline-block">
                          <p className="text-white font-mono">
                            {winnerInfo.winnerAddress.slice(0, 6)}...{winnerInfo.winnerAddress.slice(-4)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-white mb-3">游戏结束</p>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 inline-block">
                          <p className="text-sm text-yellow-100 mb-1">获胜者</p>
                          <p className="text-white font-mono">
                            {winnerInfo.winnerAddress.slice(0, 6)}...{winnerInfo.winnerAddress.slice(-4)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-white">正在加载获胜者信息...</p>
                )}
                <button
                  onClick={onBack}
                  className="mt-6 bg-white hover:bg-gray-100 text-yellow-600 font-bold py-3 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all"
                >
                  🏠 返回大厅
                </button>
              </div>
            </div>
          )}

          {/* 等待玩家加入提示 - 仅在游戏等待状态且玩家数 < 2 时显示 */}
          {gameState === 0 && playerCount < 2 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-xl border-2 border-blue-400">
              <div className="text-center">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-white font-semibold text-lg mb-2">等待其他玩家加入...</p>
                <p className="text-blue-100 text-sm">至少需要 2 名玩家才能开始游戏</p>
              </div>
            </div>
          )}

          {/* 开始游戏按钮 - 仅在游戏等待状态且玩家数 >= 2 时显示 */}
          {gameState === 0 && playerCount >= 2 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-xl border-2 border-purple-400">
              {(() => {
                const dealerIndex = state.tableInfo ? Number(state.tableInfo[5]) : null;
                const isDealer = myPlayerIndex !== null && dealerIndex !== null && myPlayerIndex === dealerIndex;

                if (isDealer) {
                  return (
                    <>
                      <p className="text-white font-semibold mb-4 text-center text-lg">✅ 准备就绪！</p>
                      <button
                        onClick={handleStartGame}
                        disabled={isStartingGame || state.isLoading}
                        className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-400 text-purple-600 font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all text-lg"
                      >
                        {isStartingGame ? `⏳ ${t('game.starting')}` : `🎮 ${t('game.start_game')}`}
                      </button>
                    </>
                  );
                } else {
                  const dealerAddress = playersInfo && dealerIndex !== null ? playersInfo.players[dealerIndex] : null;
                  const dealerDisplay = dealerAddress ? `${dealerAddress.slice(0, 6)}...${dealerAddress.slice(-4)}` : '庄家';
                  return (
                    <p className="text-white font-semibold text-center text-lg">⏳ 等待 {dealerDisplay} 开始游戏...</p>
                  );
                }
              })()}
            </div>
          )}

          {/* Showdown 阶段 - 公开手牌 */}
          {gameState === 5 && decryptedCards.card1 !== null && decryptedCards.card2 !== null && !hasRevealedCards && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl border-2 border-purple-400">
              <h4 className="text-2xl font-bold text-white mb-3 text-center">🎴 摊牌阶段</h4>
              <p className="text-purple-100 mb-4 text-center">请公开你的手牌以参与比牌</p>
              <button
                onClick={async () => {
                  try {
                    setActionInProgress(true);
                    await contractService.revealCards(tableId, decryptedCards.card1!, decryptedCards.card2!);
                    setHasRevealedCards(true); // 立即更新状态，避免重复点击
                    await loadGameInfo();
                  } catch (err) {
                    console.error('❌ 公开手牌失败:', err);
                    alert('公开手牌失败: ' + (err as Error).message);
                    setHasRevealedCards(false); // 如果失败，重置状态
                  } finally {
                    setActionInProgress(false);
                  }
                }}
                disabled={actionInProgress}
                className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-400 text-purple-600 font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all"
              >
                {actionInProgress ? '⏳ 公开中...' : '🃏 公开手牌'}
              </button>
            </div>
          )}

          {/* Showdown 阶段 - 已公开手牌提示 */}
          {gameState === 5 && hasRevealedCards && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-xl border-2 border-green-400">
              <h4 className="text-2xl font-bold text-white mb-2 text-center">✅ 手牌已公开</h4>
              <p className="text-green-100 text-center">等待其他玩家公开手牌...</p>
            </div>
          )}

          {/* 轮流提示 */}
          {myPlayerIndex !== null && state.tableInfo && gameState !== 0 && gameState !== 5 && gameState !== 6 && (
            <div className="mb-6">
              {(() => {
                const currentPlayerIndex = Number(state.tableInfo[3]);
                return myPlayerIndex === currentPlayerIndex ? (
                  <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg border-2 border-green-400 animate-pulse">
                    <p className="text-white font-bold text-center text-lg">✅ {t('game.your_turn_action')}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-700 bg-opacity-50 rounded-xl border-2 border-slate-600">
                    <p className="text-slate-300 text-center">⏳ {t('game.waiting_for_other_players')}</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 游戏操作按钮 - 仅在非 Showdown 和非 Finished 阶段显示 */}
          {gameState !== 5 && gameState !== 6 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const currentPlayerIndex = state.tableInfo ? Number(state.tableInfo[3]) : null;
                const isMyTurn = myPlayerIndex !== null && currentPlayerIndex !== null && myPlayerIndex === currentPlayerIndex;
                // 当游戏未开始或玩家数量不足时，禁用所有按钮
                const isDisabled = actionInProgress || state.isLoading || !isMyTurn || gameState === 0 || playerCount < 2;

                return (
                  <>
                  <button
                    onClick={handleCheck}
                    disabled={isDisabled}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 disabled:scale-100 transition-all border-2 border-blue-400 disabled:border-gray-500"
                    title={!isMyTurn ? t('game.not_your_turn') : ''}
                  >
                    <div className="text-2xl mb-1">✋</div>
                    <div>{actionInProgress ? t('game.processing') : t('game.actions.check')}</div>
                  </button>
                  <button
                    onClick={handleCall}
                    disabled={isDisabled}
                    className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 disabled:scale-100 transition-all border-2 border-green-400 disabled:border-gray-500"
                    title={!isMyTurn ? t('game.not_your_turn') : ''}
                  >
                    <div className="text-2xl mb-1">💰</div>
                    <div>{actionInProgress ? t('game.processing') : t('game.actions.call')}</div>
                  </button>
                  <button
                    onClick={handleBet}
                    disabled={isDisabled}
                    className="bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 disabled:scale-100 transition-all border-2 border-yellow-400 disabled:border-gray-500"
                    title={!isMyTurn ? t('game.not_your_turn') : ''}
                  >
                    <div className="text-2xl mb-1">📈</div>
                    <div>{actionInProgress ? t('game.processing') : t('game.actions.raise')}</div>
                  </button>
                  <button
                    onClick={handleFold}
                    disabled={isDisabled}
                    className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 disabled:scale-100 transition-all border-2 border-red-400 disabled:border-gray-500"
                    title={!isMyTurn ? t('game.not_your_turn') : ''}
                  >
                    <div className="text-2xl mb-1">🚫</div>
                    <div>{actionInProgress ? t('game.processing') : t('game.actions.fold')}</div>
                  </button>
                </>
              );
            })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

