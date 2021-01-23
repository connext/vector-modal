import { constants } from 'ethers';
import { theme, useStyles } from './style';

export const CHAIN_INFO_URL = 'https://chainid.network/chains.json';

const PROD_IFRAME_WALLET = 'https://wallet.connext.network';

export const iframeSrc = process.env.REACT_APP_IFRAME_SRC || PROD_IFRAME_WALLET;

export const ethProvidersOverrides = JSON.parse(
  process.env.REACT_APP_ETH_PROVIDERS || '{}'
);

const ASSET_CHAIN_NAME_MAPPING: {
  [chainId: number]: { [assetId: string]: string };
} = {
  1: {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
    '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': 'MATIC',
  },
  5: {
    '0x655F2166b0709cd575202630952D71E2bB0d61Af': 'DERC20',
    '0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa': 'TEST',
  },
  137: {
    '0x0000000000000000000000000000000000001010': 'MATIC',
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'USDC',
  },
  80001: {
    '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1': 'DERC20',
  },
};

export const getAssetName = (assetId: string, chainId: number): string => {
  if (assetId === constants.AddressZero) {
    return 'ETH';
  }
  return ASSET_CHAIN_NAME_MAPPING[chainId]
    ? ASSET_CHAIN_NAME_MAPPING[chainId][assetId] ?? 'Token'
    : 'Token';
};

export const TRANSFER_STATES = {
  LOADING: 'LOADING',
  INITIAL: 'INITIAL',
  DEPOSITING: 'DEPOSITING',
  TRANSFERRING: 'TRANSFERRING',
  WITHDRAWING: 'WITHDRAWING',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
} as const;
export type TransferStates = keyof typeof TRANSFER_STATES;

export const ERROR_STATES = {
  REFRESH: 'REFRESH',
  CONTACT_INFO: 'CONTACT_INFO',
  RETRY: 'RETRY',
} as const;
export type ErrorStates = keyof typeof ERROR_STATES;

export type Screens = 'Recover' | 'Home';

export const message = (activeMessage: number) => {
  switch (activeMessage) {
    case 0:
      return 'Connecting to Network...';

    case 1:
      return `Setting Up Deposit Address...`;

    case 2:
      return `Loading most recent transfers...`;

    case 3:
      return `Looking for existing Channel Balance...`;

    default:
      return 'Connecting to Network...';
  }
};

export { theme, useStyles };
