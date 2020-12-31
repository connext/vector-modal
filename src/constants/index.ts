import { constants } from 'ethers';

import { TRANSFER_STATES, TransferStates } from './types';

export const CHAIN_INFO_URL = 'https://chainid.network/chains.json';

const PROD_IFRAME_WALLET = 'https://wallet.connext.network';

export const iframeSrc = process.env.REACT_APP_IFRAME_SRC || PROD_IFRAME_WALLET;

export const ethProvidersOverrides = JSON.parse(
  process.env.REACT_APP_ETH_PROVIDERS || '{}'
);

export { TransferStates, TRANSFER_STATES };

const ASSET_CHAIN_NAME_MAPPING: {
  [chainId: number]: { [assetId: string]: string };
} = {
  5: {
    '0x655F2166b0709cd575202630952D71E2bB0d61Af': 'USDC',
  },
  80001: {
    '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1': 'USDC',
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
