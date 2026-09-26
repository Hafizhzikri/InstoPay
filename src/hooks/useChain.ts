/**
 * useChain — resolves the active Arc chain the connected wallet is on.
 * Reads from wagmi useAccount (wallet's actual connected chain).
 */
import { useAccount } from 'wagmi';
import { ARC_TESTNET_CHAIN_ID, ARC_MAINNET_CHAIN_ID } from '../contract';

export function useChain() {
  const { chainId: walletChainId, isConnected } = useAccount();

  const isMainnet = isConnected && walletChainId === ARC_MAINNET_CHAIN_ID;
  const isTestnet = !isConnected || walletChainId === ARC_TESTNET_CHAIN_ID;
  const isSupportedArcChain =
    walletChainId === ARC_TESTNET_CHAIN_ID || walletChainId === ARC_MAINNET_CHAIN_ID;

  const chainId: number = isMainnet ? ARC_MAINNET_CHAIN_ID : ARC_TESTNET_CHAIN_ID;
  const chainName  = isMainnet ? 'Arc Mainnet' : 'Arc Testnet';
  const chainShort = isMainnet ? 'Mainnet' : 'Testnet';
  const explorerBase = isMainnet
    ? 'https://explorer.arc.io'
    : 'https://explorer.testnet.arc.io';
  const dotColor = isMainnet ? '#f59e0b' : '#4ade80';

  return {
    chainId,
    chainName,
    chainShort,
    isMainnet,
    isTestnet,
    isSupportedArcChain,
    explorerBase,
    dotColor,
  };
}
