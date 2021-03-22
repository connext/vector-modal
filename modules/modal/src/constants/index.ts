export * from './types';

export const CHAIN_INFO_URL = 'https://chainid.network/chains.json';

const PROD_IFRAME_WALLET = 'https://wallet.connext.network';

export const iframeSrc = PROD_IFRAME_WALLET;

export const ethProvidersOverrides = JSON.parse(
  process.env.REACT_APP_ETH_PROVIDERS || '{}'
);
