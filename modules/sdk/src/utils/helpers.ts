import { providers, BigNumber, constants, Contract, utils } from 'ethers';
import { ERC20Abi, ChainInfo } from '@connext/vector-types';
import {
  getChainInfo,
  getChainId,
  getAssetDecimals,
} from '@connext/vector-utils';
import { CHAIN_DETAIL, AddEthereumChainParameter } from '../constants';
import { delay } from '@connext/vector-utils';

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
  // eslint-disable-next-line
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
      console.log('chain:', chainId);
    } catch (e) {
      throw new Error(
        `Error getting chain Id from provider ${chainProvider}: ${e}`
      );
    }
  }

  const rpcProvider = new providers.JsonRpcProvider(chainProvider, chainId);

  // get decimals for deposit asset
  const assetDecimals = await getAssetDecimals(assetId, rpcProvider);

  const chain: ChainInfo = await getChainInfo(chainId);
  const chainName = chain.name;
  const assetName = chain.assetId[assetId]?.symbol ?? 'Token';

  const chainParams: AddEthereumChainParameter = {
    chainId: utils.hexValue(chain.chainId),
    chainName: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: 18,
    },
    rpcUrls: chain.rpc,
  };

  const chainInfo: CHAIN_DETAIL = {
    name: chainName,
    chainId: chainId,
    chainProvider: chainProvider,
    rpcProvider: rpcProvider,
    assetName: assetName,
    assetId: assetId,
    assetDecimals: assetDecimals,
    chainParams: chainParams,
  };

  return chainInfo;
};

export const getUserBalance = async (
  injectedProvider: providers.Web3Provider,
  senderChainAssetId: string,
  senderChainAssetDecimals: number
): Promise<string> => {
  const userAddress = await injectedProvider!.getSigner().getAddress();
  console.log('injected signer address', userAddress);

  const balance = await getOnchainBalance(
    injectedProvider,
    senderChainAssetId,
    userAddress
  );

  const userBalance = utils.formatUnits(balance, senderChainAssetDecimals);

  return userBalance;
};

export const truncate = (str: string, maxDecimalDigits: number) => {
  if (str.includes('.')) {
    const parts = str.split('.');
    return parts[0] + '.' + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};
