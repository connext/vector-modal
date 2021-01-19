import { providers, BigNumber, constants, Contract } from 'ethers';
import { ERC20Abi } from '@connext/vector-types';
import { TransferStates } from '../constants';
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
    [depositChainId]: new providers.JsonRpcProvider(depositProviderUrl),
    [withdrawChainId]: new providers.JsonRpcProvider(withdrawProviderUrl),
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
