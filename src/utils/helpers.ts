import { providers, BigNumber, constants, Contract, utils } from 'ethers';
import { ERC20Abi } from '@connext/vector-types';
import {
  getChainInfo,
  getChainId,
  getAssetDecimals,
} from '@connext/vector-utils';
import {
  TransferStates,
  CHAIN_DETAIL,
  ASSET_CHAIN_NAME_MAPPING,
} from '../constants';
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

export const getAssetName = (assetId: string, chainId: number): string => {
  if (assetId === constants.AddressZero) {
    return 'ETH';
  }
  return ASSET_CHAIN_NAME_MAPPING[chainId]
    ? ASSET_CHAIN_NAME_MAPPING[chainId][assetId] ?? 'Token'
    : 'Token';
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

export const getChain = async (
  _chainId: number | undefined,
  chainProvider: string,
  _assetId: string
) => {
  // Sender Chain Info
  const assetId = utils.getAddress(_assetId);
  let chainId = _chainId;
  if (!chainId) {
    try {
      chainId = await getChainId(chainProvider);
      console.log('sender chain:', chainId);
    } catch (e) {
      throw new Error(
        `Error getting chain Id from provider ${chainProvider}: ${e}`
      );
    }
  }

  const rpcProvider = new providers.JsonRpcProvider(chainProvider, chainId);

  // get decimals for deposit asset
  const assetDecimals = await getAssetDecimals(assetId, rpcProvider);

  const chain = await getChainInfo(chainId);
  const chainName = chain.name;
  const assetName = chain.assetId[assetId]
    ? chain.assetId[assetId] ?? 'Token'
    : 'Token';

  const chainInfo: CHAIN_DETAIL = {
    name: chainName,
    chainId: chainId,
    chainProvider: chainProvider,
    rpcProvider: rpcProvider,
    assetName: assetName,
    assetId: assetId,
    assetDecimals: assetDecimals,
  };

  return chainInfo;
};

export const getUserBalance = async (
  injectedProvider: providers.Web3Provider,
  senderChainInfo: CHAIN_DETAIL
): Promise<string> => {
  const userAddress = await injectedProvider!.getSigner().getAddress();
  console.log('injected signer address', userAddress);

  const balance = await getOnchainBalance(
    injectedProvider,
    senderChainInfo.assetId,
    userAddress
  );

  const userBalance = utils.formatUnits(balance, senderChainInfo.assetDecimals);

  return userBalance;
};
