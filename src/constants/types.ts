import { providers } from 'ethers';

export interface CHAIN_DETAIL {
  name: string;
  chainId: number;
  chainProvider: string;
  rpcProvider: providers.JsonRpcProvider;
  assetName: string;
  assetId: string;
  assetDecimals: number;
}

export const ERROR_STATES = {
  ERROR_SETUP: 'ERROR_SETUP',
  ERROR_TRANSFER: 'ERROR_TRANSFER',
} as const;
export type ErrorStates = keyof typeof ERROR_STATES;

export const SCREEN_STATES = {
  LOGIN: 'LOGIN',
  EMAIL: 'EMAIL',
  LOADING: 'LOADING',
  SWAP: 'SWAP',
  RECOVERY: 'RECOVERY',
  LISTENER: 'LISTENER',
  STATUS: 'STATUS',
  SUCCESS: 'SUCCESS',
  ...ERROR_STATES,
} as const;
export type ScreenStates = keyof typeof SCREEN_STATES;
