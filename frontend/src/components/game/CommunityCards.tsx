import { PokerCard } from './PokerCard';
import { formatChips } from '../../lib/poker';

interface CommunityCardsProps {
  cards: number[];
  pot: number;
  gameState: number;
}

export function CommunityCards({ cards, pot, gameState }: CommunityCardsProps) {
  const getStateName = (state: number) => {
    const names = ['等待中', '翻牌前', '翻牌', '转牌', '河牌', '摊牌', '已结束'];
    return names[state] || '未知';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 游戏状态 */}
      <div className="bg-white/90 backdrop-blur rounded-lg px-8 py-3 shadow-lg">
        <span className="text-xl font-bold text-gray-800">
          {getStateName(gameState)}
        </span>
      </div>

      {/* 公共牌 */}
      <div className="flex gap-4 bg-poker-felt/50 backdrop-blur rounded-xl p-6 shadow-2xl border-2 border-white/20">
        {cards.length > 0 ? (
          cards.map((card, index) => (
            <div
              key={index}
              className="animate-[fadeIn_0.3s_ease-in]"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PokerCard value={card} />
            </div>
          ))
        ) : (
          // 占位符
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="w-24 h-36 bg-white/10 rounded-lg border-2 border-white/20 border-dashed"
            />
          ))
        )}
      </div>

      {/* 奖池 */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full px-10 py-4 shadow-lg">
        <div className="text-center">
          <div className="text-sm text-yellow-900 font-semibold mb-1">奖池</div>
          <div className="text-3xl font-bold text-white">
            {formatChips(pot)}
          </div>
        </div>
      </div>
    </div>
  );
}
