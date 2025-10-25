import { cardToString, getCardColor } from '../../lib/poker';

interface PokerCardProps {
  value: number;
  hidden?: boolean;
  small?: boolean;
}

export function PokerCard({ value, hidden = false, small = false }: PokerCardProps) {
  // 使用内联样式确保尺寸生效
  // 默认使用 w-16 h-24 (64px x 96px)，small 使用更小的尺寸
  const sizeStyle = small
    ? { width: '3rem', height: '4.5rem' }    // 48px x 72px (更小)
    : { width: '4rem', height: '6rem' };     // 64px x 96px (w-16 h-24)

  if (hidden) {
    return (
      <div
        style={sizeStyle}
        className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-900 flex items-center justify-center shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]" />
        </div>
        <span className="text-white text-3xl font-bold z-10">🂠</span>
      </div>
    );
  }

  const cardStr = cardToString(value);
  const color = getCardColor(value);

  return (
    <div
      style={sizeStyle}
      className={`
        bg-white
        rounded-lg border-2 border-gray-300
        flex flex-col items-center justify-center
        shadow-lg
        transition-transform hover:scale-105
        ${color === 'red' ? 'text-red-600' : 'text-gray-900'}
      `}
    >
      <span className={`${small ? 'text-xl' : 'text-3xl'} font-bold`}>
        {cardStr}
      </span>
    </div>
  );
}
