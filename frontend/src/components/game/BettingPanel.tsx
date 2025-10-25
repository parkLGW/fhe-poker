import { useState } from 'react';
import { formatChips } from '../../lib/poker';

interface BettingPanelProps {
  isMyTurn: boolean;
  myBalance: number;
  currentBet: number;
  minRaise: number;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onBet: (amount: number) => void;
  disabled?: boolean;
}

export function BettingPanel({
  isMyTurn,
  myBalance,
  currentBet,
  minRaise,
  onFold,
  onCheck,
  onCall,
  onBet,
  disabled = false,
}: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState(minRaise);
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  const canCheck = currentBet === 0;
  const callAmount = currentBet;

  const handleBet = () => {
    // 验证加注金额
    if (betAmount < minRaise) {
      alert(`❌ 最小加注金额为 ${formatChips(minRaise)}`);
      return;
    }
    if (betAmount > myBalance) {
      alert(`❌ 余额不足！你的筹码: ${formatChips(myBalance)}`);
      return;
    }

    // 调用加注回调
    onBet(betAmount);
    setShowRaiseInput(false);
    setBetAmount(minRaise);
  };

  if (!isMyTurn) {
    return (
      <div className="glass-effect rounded-2xl shadow-2xl p-8 text-center border-2 border-white/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-3xl">⏳</span>
          </div>
          <p className="text-white font-bold text-lg">
            等待其他玩家操作...
          </p>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl shadow-2xl p-6 border-2 border-white/20">
      {/* 筹码信息 */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/30">
          <span className="text-sm text-white/80 font-medium flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span>我的筹码</span>
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {formatChips(myBalance)}
          </span>
        </div>
        {currentBet > 0 && (
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30">
            <span className="text-sm text-white/80 font-medium flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span>需要跟注</span>
            </span>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {formatChips(callAmount)}
            </span>
          </div>
        )}
      </div>

      {/* 加注输入 */}
      {showRaiseInput && (
        <div className="mb-6 p-5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border-2 border-yellow-400/30 backdrop-blur-sm">
          <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-lg">💵</span>
            <span>加注金额</span>
          </label>
          <div className="flex gap-3 mb-3">
            <input
              type="number"
              min={minRaise}
              max={myBalance}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="flex-1 px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 placeholder-white/40 backdrop-blur-sm"
              placeholder={`最小 ${minRaise}`}
            />
            <button
              onClick={handleBet}
              disabled={disabled || betAmount < minRaise || betAmount > myBalance}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              ✓ 确认
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setBetAmount(minRaise)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-all duration-200 border border-white/20 hover:border-white/40"
            >
              最小
            </button>
            <button
              onClick={() => setBetAmount(Math.floor(myBalance / 2))}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-all duration-200 border border-white/20 hover:border-white/40"
            >
              1/2池
            </button>
            <button
              onClick={() => setBetAmount(myBalance)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              全下 🔥
            </button>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 弃牌 */}
        <button
          onClick={onFold}
          disabled={disabled}
          className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center gap-2">
            <span className="text-xl">🚫</span>
            <span>弃牌</span>
          </span>
        </button>

        {/* 过牌/跟注 */}
        {canCheck ? (
          <button
            onClick={onCheck}
            disabled={disabled}
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2">
              <span className="text-xl">✓</span>
              <span>过牌</span>
            </span>
          </button>
        ) : (
          <button
            onClick={onCall}
            disabled={disabled}
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex flex-col items-center">
              <span className="text-sm">跟注</span>
              <span className="text-lg font-black">{formatChips(callAmount)}</span>
            </span>
          </button>
        )}

        {/* 加注按钮 */}
        <button
          onClick={() => setShowRaiseInput(!showRaiseInput)}
          disabled={disabled}
          className={`group relative overflow-hidden col-span-2 px-6 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed ${
            showRaiseInput
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400'
          } disabled:from-gray-500 disabled:to-gray-600 text-white`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center gap-2">
            <span className="text-xl">{showRaiseInput ? '✕' : '💰'}</span>
            <span>{showRaiseInput ? '取消加注' : '加注'}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
