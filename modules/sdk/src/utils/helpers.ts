import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import { getAddress } from "@ethersproject/address";
import { hexValue } from "@ethersproject/bytes";
import { BaseProvider, JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { AddressZero } from "@ethersproject/constants";
import { ERC20Abi, ChainInfo } from "@connext/vector-types";
import { getChainInfo, getChainId, getAssetDecimals, delay } from "@connext/vector-utils";

import { ChainDetail, AddEthereumChainParameter } from "../constants";

export { getChainInfo, ChainInfo };

export const hydrateProviders = (
  depositChainId: number,
  depositProviderUrl: string,
  withdrawChainId: number,
  withdrawProviderUrl: string,
): {
  [chainId: number]: BaseProvider;
} => {
  return {
    [depositChainId]: new JsonRpcProvider(depositProviderUrl, depositChainId),
    [withdrawChainId]: new JsonRpcProvider(withdrawProviderUrl, withdrawChainId),
  };
};

export const getOnchainBalance = async (
  ethProvider: BaseProvider,
  assetId: string,
  address: string,
): Promise<BigNumber> => {
  const balance =
    assetId === AddressZero
      ? await ethProvider.getBalance(address)
      : await new Contract(assetId, ERC20Abi, ethProvider).balanceOf(address);
  return balance;
};

export const retryWithDelay = async <T = any>(fn: () => Promise<T>, retries = 5): Promise<T> => {
  let error: Error = new Error("Shouldn't happen");
  // eslint-disable-next-line
  for (const _ of Array(retries).fill(0)) {
    try {
      const res = await fn();
      return res;
    } catch (e) {
      error = e;
      console.warn(fn.name, "failed, retrying. error:", e.message);
    }
    await delay(1500);
  }
  throw error;
};

export const getChain = async (
  _chainId: number | undefined,
  chainProvider: string,
  _assetId: string,
): Promise<ChainDetail> => {
  // Sender Chain Info
  const assetId = getAddress(_assetId);
  let chainId = _chainId;
  if (!chainId) {
    try {
      chainId = await getChainId(chainProvider);
      console.log("chain:", chainId);
    } catch (e) {
      throw new Error(`Error getting chain Id from provider ${chainProvider}: ${e}`);
    }
  }

  const rpcProvider = new JsonRpcProvider(chainProvider, chainId);

  // get decimals for deposit asset
  const assetDecimals = await getAssetDecimals(assetId, rpcProvider);

  const chain: ChainInfo = await getChainInfo(chainId);
  const chainName = chain.name;
  const assetName = chain.assetId[assetId]?.symbol ?? "Token";

  const chainParams: AddEthereumChainParameter = {
    chainId: hexValue(chain.chainId),
    chainName: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
      decimals: 18,
    },
    rpcUrls: chain.rpc,
  };

  const chainInfo: ChainDetail = {
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
  injectedProvider: Web3Provider,
  senderChainAssetId: string,
  senderChainAssetDecimals: number,
): Promise<string> => {
  const userAddress = await injectedProvider!.getSigner().getAddress();
  console.log("injected signer address", userAddress);

  const balance = await getOnchainBalance(injectedProvider, senderChainAssetId, userAddress);

  const userBalance = formatUnits(balance.toString(), senderChainAssetDecimals);

  return userBalance;
};

export const truncate = (str: string, maxDecimalDigits: number): string => {
  if (str.includes(".")) {
    const parts = str.split(".");
    return parts[0] + "." + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};

export const isValidAddress = (input: string): boolean => {
  const valid = input.match(/0x[0-9a-fA-F]{40}/);
  return !!valid;
};
