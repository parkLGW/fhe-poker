import { PokerCard } from '../components/game/PokerCard';

export function CardTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-felt to-poker-green p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🎴 卡牌尺寸测试</h1>
        
        {/* 手牌测试 - 大尺寸 */}
        <div className="bg-white/90 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">手牌 - 大尺寸 (w-24 h-36)</h2>
          <div className="flex gap-4 justify-center">
            <PokerCard value={0} />  {/* ♠A */}
            <PokerCard value={13} /> {/* ♥A */}
            <PokerCard value={26} /> {/* ♦A */}
            <PokerCard value={39} /> {/* ♣A */}
          </div>
        </div>

        {/* 手牌测试 - 小尺寸 */}
        <div className="bg-white/90 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">手牌 - 小尺寸 (w-16 h-24)</h2>
          <div className="flex gap-4 justify-center">
            <PokerCard value={0} small />
            <PokerCard value={13} small />
            <PokerCard value={26} small />
            <PokerCard value={39} small />
          </div>
        </div>

        {/* 公共牌测试 */}
        <div className="bg-white/90 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">公共牌 - 大尺寸 (w-24 h-36)</h2>
          <div className="flex gap-4 justify-center bg-poker-felt/50 backdrop-blur rounded-xl p-6">
            <PokerCard value={12} /> {/* ♠K */}
            <PokerCard value={25} /> {/* ♥K */}
            <PokerCard value={38} /> {/* ♦K */}
            <PokerCard value={51} /> {/* ♣K */}
            <PokerCard value={11} /> {/* ♠Q */}
          </div>
        </div>

        {/* 隐藏牌测试 */}
        <div className="bg-white/90 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">隐藏牌（背面）</h2>
          <div className="flex gap-4 justify-center">
            <PokerCard value={0} hidden />
            <PokerCard value={0} hidden />
            <PokerCard value={0} hidden small />
            <PokerCard value={0} hidden small />
          </div>
        </div>

        {/* 尺寸对比 */}
        <div className="bg-white/90 rounded-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">尺寸对比</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">修改前的尺寸</h3>
              <div className="flex gap-2">
                <div className="w-12 h-16 bg-blue-200 rounded-lg flex items-center justify-center text-xs">
                  small<br/>12x16
                </div>
                <div className="w-16 h-24 bg-blue-300 rounded-lg flex items-center justify-center text-xs">
                  normal<br/>16x24
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">修改后的尺寸</h3>
              <div className="flex gap-2">
                <div className="w-16 h-24 bg-green-200 rounded-lg flex items-center justify-center text-xs">
                  small<br/>16x24
                </div>
                <div className="w-24 h-36 bg-green-300 rounded-lg flex items-center justify-center text-xs">
                  normal<br/>24x36
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-white text-lg underline hover:text-yellow-300">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}

