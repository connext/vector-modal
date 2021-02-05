import { providers, BigNumber, constants, Contract, utils } from 'ethers';
import { ERC20Abi } from '@connext/vector-types';
import { TransferStates, CHAIN_INFO_URL, NETWORK_NAME } from '../constants';
import { delay } from '@connext/vector-utils';

export const activePhase = (phase: TransferStates): number => {
  switch (phase) {
    case 'LOADING': {
      return -2;
    }
    case 'INITIAL': {
      return -1;
    }
    case 'DEPOSITING': {
      return 0;
    }
    case 'TRANSFERRING': {
      return 1;
    }
    case 'WITHDRAWING': {
      return 2;
    }
    case 'COMPLETE': {
      return 3;
    }
    case 'ERROR': {
      return 4;
    }
  }
};

export const hydrateProviders = (
  depositChainId: number,
  depositProviderUrl: string,
  withdrawChainId: number,
  withdrawProviderUrl: string
): {
  [chainId: number]: providers.BaseProvider;
} => {
  return {
    [depositChainId]: new providers.JsonRpcProvider(
      depositProviderUrl,
      depositChainId
    ),
    [withdrawChainId]: new providers.JsonRpcProvider(
      withdrawProviderUrl,
      withdrawChainId
    ),
  };
};

export const getOnchainBalance = async (
  ethProvider: providers.BaseProvider,
  assetId: string,
  address: string
): Promise<BigNumber> => {
  const balance =
    assetId === constants.AddressZero
      ? await ethProvider.getBalance(address)
      : await new Contract(assetId, ERC20Abi, ethProvider).balanceOf(address);
  return balance;
};

export const retryWithDelay = async <T = any>(
  fn: () => Promise<T>,
  retries = 5
): Promise<T> => {
  let error: Error = new Error("Shouldn't happen");
  for (const _ of Array(retries).fill(0)) {
    try {
      const res = await fn();
      return res;
    } catch (e) {
      error = e;
      console.warn(fn.name, 'failed, retrying. error:', e.message);
    }
    await delay(1500);
  }
  throw error;
};

export const getChainInfo = async (chainId: number) => {
  if (NETWORK_NAME[chainId]) {
    console.log(NETWORK_NAME[chainId]);
    return NETWORK_NAME[chainId];
  } else {
    try {
      const chainInfo: any[] = await utils.fetchJson(CHAIN_INFO_URL);
      const chain = chainInfo.find(info => info.chainId === chainId);
      if (chain) {
        return chain.name;
      }
    } catch (e) {
      console.warn(`Could not fetch chain info from ${CHAIN_INFO_URL}`);
      return;
    }
  }
};

export const getAssetDecimals = async (
  chainId: number,
  assetId: string,
  ethProvider: providers.BaseProvider
) => {
  if (assetId !== constants.AddressZero) {
    try {
      const token = new Contract(assetId, ERC20Abi, ethProvider);
      const supply = await token.totalSupply();
      console.log('supply: ', supply);
      const decimals = await token.decimals();
      console.log(`Detected token decimals for chainId ${chainId}: `, decimals);
      return decimals;
    } catch (e) {
      console.error(
        `Error detecting decimals, unsafely falling back to 18 decimals for chainId ${chainId}: `,
        e
      );
    }
  } else {
    console.log(`Using native asset 18 decimals for chainId ${chainId}`);
  }
};
