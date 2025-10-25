import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { initFHEVM, encryptUint64, encryptUint8, resetFHEVM, decryptUint8, decryptUint8Batch } from '../lib/fhevm';
import { POKER_TABLE_ADDRESS } from '../lib/contract';

export function useFHEVM() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 初始化FHEVM
  useEffect(() => {
    if (!address || isInitialized || isInitializing) {
      return;
    }

    const initialize = async () => {
      setIsInitializing(true);
      setError(null);

      // 设置30秒超时
      const timeoutId = setTimeout(() => {
        resetFHEVM();
        setIsInitializing(false);
        setError(new Error('FHEVM初始化超时，请刷新页面重试'));
      }, 30000);

      try {
        await initFHEVM(chainId);
        clearTimeout(timeoutId);
        setIsInitialized(true);
      } catch (err) {
        clearTimeout(timeoutId);
        resetFHEVM(); // 重置Promise状态
        setError(err as Error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [address, chainId, retryCount]); // 添加 retryCount 以支持重试

  // 手动重试初始化
  const retryInitialization = () => {
    setIsInitialized(false);
    setIsInitializing(false);
    setError(null);
    resetFHEVM();
    setRetryCount(prev => prev + 1);
  };

  // 加密买入金额
  const encryptBuyIn = async (amount: number) => {
    if (!isInitialized || !address) {
      throw new Error('FHEVM not initialized or no address');
    }
    return encryptUint64(amount, POKER_TABLE_ADDRESS, address);
  };

  // 加密下注金额
  const encryptBetAmount = async (amount: number) => {
    if (!isInitialized || !address) {
      throw new Error('FHEVM not initialized or no address');
    }
    return encryptUint64(amount, POKER_TABLE_ADDRESS, address);
  };

  // 加密扑克牌
  const encryptCard = async (cardValue: number) => {
    if (!isInitialized || !address) {
      throw new Error('FHEVM not initialized or no address');
    }
    return encryptUint8(cardValue, POKER_TABLE_ADDRESS, address);
  };

  // 解密手牌
  const decryptCard = async (handle: string, contractAddr: string, userAddr: string, signer: any) => {
    if (!isInitialized) {
      throw new Error('FHEVM not initialized');
    }
    return decryptUint8(handle, contractAddr, userAddr, signer);
  };

  // 批量解密手牌 (只签名一次)
  const decryptCards = async (handles: string[], contractAddr: string, userAddr: string, signer: any) => {
    if (!isInitialized) {
      throw new Error('FHEVM not initialized');
    }
    return decryptUint8Batch(handles, contractAddr, userAddr, signer);
  };

  // 解密余额(暂不实现)
  const decryptBalance = async (_handle: string) => {
    throw new Error('Decryption not implemented yet');
  };

  return {
    isInitialized,
    isInitializing,
    error,
    encryptBuyIn,
    encryptBetAmount,
    encryptCard,
    decryptCard,
    decryptCards,
    decryptBalance,
    retryInitialization, // 导出重试函数
  };
}
