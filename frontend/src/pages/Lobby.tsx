import { useState, useEffect } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { GameState } from '../lib/contract';
import { getGameStateName } from '../lib/poker';
import { Game } from './Game';
import { useFHEVM } from '../hooks/useFHEVM';
import { callJoinTable, callCreateTable, readTableCount, readTableInfo, readPlayerIndex } from '../lib/ethers-contract';

interface LobbyProps {
  onBack: () => void;
}

export function Lobby({ onBack }: LobbyProps) {
  const chainId = useChainId();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [smallBlind, setSmallBlind] = useState('10');
  const [bigBlind, setBigBlind] = useState('20');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableCount, setTableCount] = useState<number>(0);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionError, setTransactionError] = useState<string>('');

  // FHEVM状态
  const fhevm = useFHEVM();

  // 检查网络
  const isCorrectNetwork = chainId === 11155111; // Sepolia

  // 定期读取游戏桌数量
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await readTableCount();
        setTableCount(Number(count));
      } catch (error) {
        console.error('读取游戏桌数量失败:', error);
      }
    }, 5000); // 5秒轮询一次

    // 立即读取一次
    readTableCount().then(count => setTableCount(Number(count))).catch(console.error);

    return () => clearInterval(interval);
  }, []);

  const handleCreateTable = async () => {
    if (!smallBlind || !bigBlind) {
      alert('请输入盲注金额');
      return;
    }

    try {
      setTransactionStatus('pending');
      await callCreateTable(Number(smallBlind), Number(bigBlind));
      setTransactionStatus('success');
      setShowCreateForm(false);

      // 刷新游戏桌列表
      setTimeout(() => {
        readTableCount().then(count => setTableCount(Number(count))).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('创建失败:', error);
      setTransactionStatus('error');
      setTransactionError((error as Error).message);
      alert('创建失败: ' + (error as Error).message);
    }
  };

  // 如果选择了游戏桌，显示游戏界面
  if (selectedTableId !== null) {
    return <Game tableId={selectedTableId} onBack={() => setSelectedTableId(null)} onLeaveGame={() => setSelectedTableId(null)} />;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* 网络提示 */}
        {!isCorrectNetwork && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <p className="font-bold">⚠️ 网络错误</p>
            <p>请切换到 Sepolia 测试网 (Chain ID: 11155111)</p>
            <p className="text-sm mt-1">当前网络: {chainId}</p>
          </div>
        )}

        {/* FHEVM状态提示 */}
        {fhevm.error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">❌ FHEVM初始化失败</p>
            <p className="text-sm mt-1">{fhevm.error.message}</p>
            <p className="text-xs mt-2">提示：Sepolia测试网可能不支持FHEVM，请尝试使用本地网络</p>
          </div>
        )}
        
        {fhevm.isInitializing && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
            <p className="font-bold">⏳ FHEVM初始化中...</p>
            <p className="text-sm mt-1">正在加载加密组件，请稍候</p>
          </div>
        )}


        {/* 交易状态 */}
        {transactionStatus !== 'idle' && (
          <div className={`border-l-4 p-4 mb-6 rounded ${
            transactionStatus === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
            transactionStatus === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
            'bg-yellow-50 border-yellow-500 text-yellow-700'
          }`}>
            <p className="font-bold">
              {transactionStatus === 'pending' && '⏳ 等待钱包确认...'}
              {transactionStatus === 'success' && '✅ 创建成功！'}
              {transactionStatus === 'error' && '❌ 交易失败'}
            </p>
            {transactionStatus === 'pending' && <p className="text-sm mt-1">请在钱包中确认交易</p>}
            {transactionStatus === 'error' && transactionError && (
              <p className="text-sm mt-1">{transactionError}</p>
            )}
            {transactionStatus === 'success' && <p className="text-sm mt-1">游戏桌已创建，刷新页面查看</p>}
          </div>
        )}

        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">游戏大厅</h1>
              <p className="text-gray-600 mt-1">
                当前有 {tableCount?.toString() || '0'} 个游戏桌
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                {showCreateForm ? '取消' : '创建游戏桌'}
              </button>
              <button
                onClick={onBack}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                返回
              </button>
            </div>
          </div>
        </div>

        {/* 创建游戏桌表单 */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">创建新游戏桌</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小盲注
                </label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  大盲注
                </label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="20"
                />
              </div>
            </div>
            <button
              onClick={handleCreateTable}
              disabled={transactionStatus === 'pending' || !isCorrectNetwork}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
            >
              {!isCorrectNetwork ? '请切换到Sepolia' :
               transactionStatus === 'pending' ? '创建中...' : '确认创建'}
            </button>
          </div>
        )}

        {/* 游戏桌列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tableCount && Number(tableCount) > 0 ? (
            Array.from({ length: Number(tableCount) }, (_, i) => (
              <TableCard key={i} tableId={i} onJoin={setSelectedTableId} fhevm={fhevm} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg">
                还没有游戏桌，创建一个开始游戏吧！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 游戏桌卡片组件
function TableCard({ tableId, onJoin, fhevm }: { tableId: number; onJoin: (tableId: number) => void; fhevm: ReturnType<typeof useFHEVM> }) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState('1000');
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [playerTableId, setPlayerTableId] = useState<number | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const { address } = useAccount();

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

  // 定期读取玩家所在的桌子
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(async () => {
      try {
        const playerIdx = await readPlayerIndex(tableId, address);
        setPlayerTableId(Number(playerIdx));
      } catch (error) {
        console.error('读取玩家桌子失败:', error);
      }
    }, 5000); // 5秒轮询一次

    // 立即读取一次
    readPlayerIndex(tableId, address).then(idx => setPlayerTableId(Number(idx))).catch(console.error);

    return () => clearInterval(interval);
  }, [tableId, address]);

  // 解析游戏桌信息
  const state = tableInfo ? Number((tableInfo as any)[0]) : GameState.Waiting;
  const playerCount = tableInfo ? Number((tableInfo as any)[1]) : 0;
  const activePlayers = tableInfo ? Number((tableInfo as any)[2]) : 0;
  const smallBlind = tableInfo ? (tableInfo as any)[8] : 0;
  const bigBlind = tableInfo ? (tableInfo as any)[9] : 0;

  // 检查当前用户是否在这个桌子中 (playerTable 存储的是 tableId + 1)
  const isPlayerInTable = playerTableId && Number(playerTableId) === tableId + 1;

  // 如果玩家在桌中且游戏已开始，自动跳转到游戏界面
  useEffect(() => {
    if (isPlayerInTable && state !== GameState.Waiting) {
      console.log('🎮 游戏已开始，跳转到游戏界面', {
        tableId,
        playerTableId,
        isPlayerInTable,
        state,
      });
      onJoin(tableId);
    }
  }, [isPlayerInTable, state, tableId, onJoin]);

  if (!tableInfo) return null;

  const handleJoin = async () => {
    if (!buyInAmount || !fhevm.isInitialized) {
      alert('请输入买入金额');
      return;
    }

    try {
      // 最小买入校验（UI 已提示：最小 = bigBlind * 20）
      const minBuyIn = (BigInt((tableInfo as any)[9]) * 20n);
      const amount = BigInt(buyInAmount);
      if (amount < minBuyIn) {
        alert(`买入金额过低，至少需要 ${minBuyIn.toString()}`);
        return;
      }

      // 使用 FHEVM 加密买入金额
      const encrypted = await fhevm.encryptBuyIn(Number(buyInAmount));

      console.log('📋 joinTable params', {
        tableId,
        buyInAmount,
        minBuyIn: minBuyIn.toString(),
        smallBlind: smallBlind?.toString?.(),
        bigBlind: bigBlind?.toString?.(),
        addr: address,
      });

      // 使用 ethers.js 调用合约（按照 dev.md 的方式）
      // ethers.js 会自动处理 Uint8Array 的序列化
      setTransactionStatus('pending');
      console.log('🎯 即将加入桌号:', tableId);
      await callJoinTable(tableId, encrypted.encryptedAmount, encrypted.inputProof);

      console.log('✅ 加入游戏成功！');
      setTransactionStatus('success');
      setShowJoinDialog(false);

      // 刷新游戏桌信息
      setTimeout(() => {
        readTableInfo(tableId).then(setTableInfo).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('加入失败:', error);
      setTransactionStatus('error');
      alert('加入失败: ' + (error as Error).message);
    }
  };

  const handleStartGame = async () => {
    if (!address) {
      alert('请连接钱包');
      return;
    }

    try {
      setTransactionStatus('pending');
      // 使用 ethers.js 调用 startGame
      const { callStartGame } = await import('../lib/ethers-contract');
      await callStartGame(tableId);
      setTransactionStatus('success');

      // 刷新游戏桌信息
      setTimeout(() => {
        readTableInfo(tableId).then(setTableInfo).catch(console.error);
      }, 1000);
    } catch (error) {
      console.error('开始游戏失败:', error);
      setTransactionStatus('error');
      alert('开始游戏失败: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">桌号 #{tableId}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          state === GameState.Waiting ? 'bg-green-100 text-green-800' :
          state === GameState.Finished ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {getGameStateName(state)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>玩家:</span>
          <span className="font-semibold">{playerCount}/6</span>
        </div>
        <div className="flex justify-between">
          <span>活跃:</span>
          <span className="font-semibold">{activePlayers}</span>
        </div>
        <div className="flex justify-between">
          <span>盲注:</span>
          <span className="font-semibold">{smallBlind.toString()}/{bigBlind.toString()}</span>
        </div>
      </div>

      {/* 如果用户在桌子中且游戏在等待状态，显示开始游戏按钮 */}
      {isPlayerInTable && state === GameState.Waiting ? (
        <button
          onClick={handleStartGame}
          disabled={playerCount < 2 || transactionStatus === 'pending'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {transactionStatus === 'pending' ? '开始中...' :
           playerCount < 2 ? '等待更多玩家' : '开始游戏'}
        </button>
      ) : (
        <button
          onClick={() => setShowJoinDialog(true)}
          disabled={isPlayerInTable || state !== GameState.Waiting || playerCount >= 6 || !fhevm.isInitialized}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {!fhevm.isInitialized ? '初始化中...' :
           isPlayerInTable ? '已在桌中' :
           state !== GameState.Waiting ? '游戏中' :
           playerCount >= 6 ? '已满' : '加入游戏'}
        </button>
      )}

      {/* 加入游戏模态对话框 */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowJoinDialog(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">加入游戏桌 #{tableId}</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                买入金额
              </label>
              <input
                type="number"
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="1000"
                min={Number(bigBlind) * 20}
              />
              <p className="text-sm text-gray-500 mt-2">
                最小买入: {(Number(bigBlind) * 20).toString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleJoin}
                disabled={transactionStatus === 'pending'}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                {transactionStatus === 'pending' ? '加入中...' : '确认加入'}
              </button>
              <button
                onClick={() => setShowJoinDialog(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
