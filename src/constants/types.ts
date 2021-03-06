import { providers } from 'ethers';

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

export interface CHAIN_DETAIL {
  name: string;
  chainId: number;
  chainProvider: string;
  rpcProvider: providers.JsonRpcProvider;
  assetName: string;
  assetId: string;
  assetDecimals: number;
  chainParams: AddEthereumChainParameter;
}

export const ERROR_STATES = {
  ERROR_SETUP: 'ERROR_SETUP',
  ERROR_TRANSFER: 'ERROR_TRANSFER',
  ERROR_NETWORK: 'ERROR_NETWORK',
} as const;
export type ErrorStates = keyof typeof ERROR_STATES;

export const SCREEN_STATES = {
  LOADING: 'LOADING',
  SWAP: 'SWAP',
  RECOVERY: 'RECOVERY',
  LISTENER: 'LISTENER',
  STATUS: 'STATUS',
  SUCCESS: 'SUCCESS',
  ...ERROR_STATES,
} as const;
export type ScreenStates = keyof typeof SCREEN_STATES;
