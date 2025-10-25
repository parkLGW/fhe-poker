import { PokerCard } from './PokerCard';
import { formatChips, getActionName } from '../../lib/poker';

interface PlayerSeatProps {
  address: string;
  balance: number;
  currentBet: number;
  isActive: boolean;
  hasFolded: boolean;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  lastAction: number;
  cards?: number[];
  showCards?: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
  gameStarted?: boolean; // 新增：游戏是否已开始
}

export function PlayerSeat({
  address,
  balance,
  currentBet,
  isActive,
  hasFolded,
  isCurrentPlayer,
  isDealer,
  isSmallBlind,
  isBigBlind,
  lastAction,
  cards = [],
  showCards = false,
  position,
  gameStarted = true, // 默认为true，保持向后兼容
}: PlayerSeatProps) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={`
      relative
      ${position === 'bottom' ? 'flex flex-col items-center' : ''}
      ${position === 'top' ? 'flex flex-col-reverse items-center' : ''}
      ${position === 'left' ? 'flex flex-row items-center' : ''}
      ${position === 'right' ? 'flex flex-row-reverse items-center' : ''}
    `}>
      {/* 当前玩家外层光晕效果 */}
      {isCurrentPlayer && (
        <>
          <div className="absolute inset-0 -m-3 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-2xl opacity-60 animate-pulse blur-md" />
          <div className="absolute inset-0 -m-2 bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500 rounded-2xl opacity-40 animate-pulse blur-sm" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      {/* 玩家信息卡片 */}
      <div className={`
        relative z-10
        glass-effect rounded-xl shadow-2xl p-4
        border-2 transition-all duration-300
        ${isCurrentPlayer ? 'border-yellow-400 ring-4 ring-yellow-300/50 shadow-yellow-400/50 shadow-2xl scale-110' : 'border-white/20'}
        ${hasFolded ? 'opacity-40 grayscale' : ''}
        ${!isActive ? 'opacity-30' : ''}
      `}>
        {/* 头部 - 地址和标记 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/30">
              {address.slice(2, 4).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-white">
              {shortAddress}
            </span>
          </div>

          {/* 标记 */}
          <div className="flex gap-1.5">
            {isDealer && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-black rounded-lg shadow-md">
                D
              </span>
            )}
            {isSmallBlind && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900 text-xs font-black rounded-lg shadow-md">
                SB
              </span>
            )}
            {isBigBlind && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-red-400 to-red-500 text-red-900 text-xs font-black rounded-lg shadow-md">
                BB
              </span>
            )}
          </div>
        </div>

        {/* 余额 */}
        <div className="text-center mb-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30">
          <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {formatChips(balance)}
          </div>
          <div className="text-xs text-white/60 font-medium mt-1">筹码</div>
        </div>

        {/* 当前下注 */}
        {currentBet > 0 && (
          <div className="text-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg px-3 py-2 border border-blue-400/30 mb-2">
            <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
              <span>💰</span>
              <span>下注: {formatChips(currentBet)}</span>
            </div>
          </div>
        )}

        {/* 最后动作 */}
        {lastAction > 0 && !hasFolded && (
          <div className="text-center mt-2">
            <span className="inline-block px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20">
              {getActionName(lastAction)}
            </span>
          </div>
        )}

        {/* 弃牌状态 */}
        {hasFolded && (
          <div className="text-center mt-2">
            <span className="inline-block px-3 py-1 bg-red-500/30 text-red-200 text-xs font-bold rounded-full border border-red-400/50">
              🚫 已弃牌
            </span>
          </div>
        )}
      </div>

      {/* 手牌 */}
      {/* 如果游戏已开始且有手牌，显示手牌；如果游戏未开始但是玩家自己的座位，显示两张牌背 */}
      {((gameStarted && cards.length > 0) || (!gameStarted && showCards)) && (
        <div className={`
          flex gap-4 mt-4
          ${position === 'top' ? 'mb-4 mt-0' : ''}
          ${position === 'left' ? 'ml-4' : ''}
          ${position === 'right' ? 'mr-4' : ''}
        `}>
          {gameStarted ? (
            // 游戏已开始，显示实际手牌
            cards.map((card, index) => (
              <PokerCard
                key={index}
                value={card}
                hidden={!showCards}
              />
            ))
          ) : (
            // 游戏未开始，显示两张牌背
            [0, 1].map((index) => (
              <PokerCard
                key={index}
                value={0}
                hidden={true}
              />
            ))
          )}
        </div>
      )}

      {/* 当前玩家指示器 */}
      {isCurrentPlayer && (
        <>
          {/* 顶部指示器 */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-md opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-yellow-900 px-5 py-2.5 rounded-full shadow-2xl animate-bounce border-2 border-yellow-200">
                <span className="text-sm font-black flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  <span>轮到你了</span>
                </span>
              </div>
            </div>
          </div>

          {/* 角标指示器 */}
          <div className="absolute -top-4 -right-4 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md opacity-75 animate-pulse"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full animate-pulse flex items-center justify-center shadow-2xl border-2 border-yellow-200">
                <span className="text-white text-xl font-bold">▶</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
