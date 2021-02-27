import { theme, useStyles } from './style';

export const CHAIN_INFO_URL = 'https://chainid.network/chains.json';

const PROD_IFRAME_WALLET = 'https://wallet.connext.network';

export const iframeSrc = process.env.REACT_APP_IFRAME_SRC ?? PROD_IFRAME_WALLET;

export const ethProvidersOverrides = JSON.parse(
  process.env.REACT_APP_ETH_PROVIDERS || '{}'
);

export const NETWORK_NAME: {
  [chainId: number]: string;
} = {
  1: 'Ethereum Mainnet',
  137: 'Matic Mainnet',
  4: 'Ethereum Testnet Rinkeby',
  5: 'Ethereum Testnet Görli',
  42: 'Ethereum Testnet Kovan',
  80001: 'Matic Testnet Mumbai',
  79377087078960: 'Arbitrum Kovan Testnet 3',
};

export const ASSET_CHAIN_NAME_MAPPING: {
  [chainId: number]: { [assetId: string]: string };
} = {
  1: {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
    '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': 'MATIC',
    '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942': 'MANA',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
  },
  5: {
    '0x655F2166b0709cd575202630952D71E2bB0d61Af': 'DERC20',
    '0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa': 'TEST',
  },
  137: {
    '0x0000000000000000000000000000000000001010': 'MATIC',
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'USDC',
    '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4': 'MANA',
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': 'DAI',
  },
  80001: {
    '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1': 'DERC20',
  },
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

export const SCREEN_STATES = {
  LOGIN: 'LOGIN',
  LOADING: 'LOADING',
  EMAIL: 'EMAIL',
  INITIAL: 'INITIAL',
  DEPOSITING: 'DEPOSITING',
  TRANSFERRING: 'TRANSFERRING',
  WITHDRAWING: 'WITHDRAWING',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
} as const;
export type ScreenStates = keyof typeof SCREEN_STATES;

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
