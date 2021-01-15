import { providers, constants, Contract, BigNumber } from 'ethers';
import {
  ERC20Abi,
  FullChannelState,
  RouterConfigResponse,
} from '@connext/vector-types';

import { TransferStates } from '../constants';
import { calculateExchangeAmount, inverse } from '@connext/vector-utils';

export const getExplorerLink = (chainId: number): string | undefined => {
  switch (chainId) {
    case 1: {
      return `https://etherscan.io`;
    }
    case 4: {
      return `https://rinkeby.etherscan.io`;
    }
    case 5: {
      return `https://goerli.etherscan.io`;
    }
    case 42: {
      return `https://kovan.etherscan.io`;
    }
    case 137: {
      return `https://explorer-mainnet.maticvigil.com`;
    }
    case 80001: {
      return `https://explorer-mumbai.maticvigil.com`;
    }
    case 152709604825713: {
      return `https://explorer.offchainlabs.com/#`;
    }
  }
  return undefined;
};

export const getExplorerLinkForTx = (
  chainId: number,
  txHash: string
): string => {
  const base = getExplorerLink(chainId);
  if (!base) {
    return '#';
  }
  return `${base}/tx/${txHash}`;
};

export const getExplorerLinkForAsset = (
  chainId: number,
  assetId: string
): string => {
  const base = getExplorerLink(chainId);
  if (!base) {
    return '#';
  }
  if (assetId === constants.AddressZero) {
    return base;
  }
  return `${base}/token/${assetId}`;
};

export const activePhase = (phase: TransferStates): number => {
  switch (phase) {
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

export const getAssetBalance = async (
  ethProviders: { [chainId: number]: providers.BaseProvider },
  chainId: number,
  assetId: string,
  address: string
): Promise<BigNumber> => {
  const balance =
    assetId === constants.AddressZero
      ? await ethProviders[chainId].getBalance(address)
      : await new Contract(assetId, ERC20Abi, ethProviders[chainId]).balanceOf(
          address
        );
  return balance;
};

export const supportedByRouter = async (
  depositChainId: number,
  withdrawChainId: number,
  fromAssetId: string,
  toAssetId: string,
  transferAmount: string,
  withdrawChannel: FullChannelState,
  routerConfig: RouterConfigResponse,
  ethProviders: { [chainId: number]: providers.BaseProvider }
): Promise<void> => {
  // Should block deposit address from showing if any of
  // the following are true:
  // - swap is not supported
  // - receiver channel router balance + onchain balance of
  //   router signer is < swapped amount
  // - router has no native asset for gas to collateralize
  const { supportedChains, allowedSwaps } = routerConfig;
  if (
    !supportedChains.includes(depositChainId) ||
    !supportedChains.includes(withdrawChainId)
  ) {
    throw new Error('Deposit/withdraw chains are not supported by router');
  }

  let invertedSwap = false;
  const swap = allowedSwaps.find(s => {
    const noninverted =
      s.fromAssetId.toLowerCase() === fromAssetId.toLowerCase() &&
      s.fromChainId === depositChainId &&
      s.toAssetId.toLowerCase() === toAssetId.toLowerCase() &&
      s.toChainId === withdrawChainId;
    const inverted =
      s.toAssetId.toLowerCase() === fromAssetId.toLowerCase() &&
      s.toChainId === depositChainId &&
      s.fromAssetId.toLowerCase() === toAssetId.toLowerCase() &&
      s.fromChainId === withdrawChainId;
    invertedSwap = inverted;
    return noninverted || inverted;
  });
  if (!swap) {
    throw new Error('Swap is not supported by router');
  }

  const onchainFromAsset = await getAssetBalance(
    ethProviders,
    withdrawChainId,
    toAssetId,
    withdrawChannel.alice
  );
  const assetIdx = withdrawChannel.assetIds.findIndex(
    a => a.toLowerCase() === toAssetId.toLowerCase()
  );
  const offchainFromAsset = BigNumber.from(
    (withdrawChannel.balances[assetIdx]?.amount ?? [])[0] ?? '0'
  );
  const holdings = onchainFromAsset.add(offchainFromAsset);
  const swappedAmount = calculateExchangeAmount(
    transferAmount,
    invertedSwap ? inverse(swap.hardcodedRate) : swap.hardcodedRate
  );
  if (holdings.lt(swappedAmount)) {
    throw new Error('Router has insufficient balance for transfer');
  }

  const nativeAsset = await getAssetBalance(
    ethProviders,
    withdrawChainId,
    constants.AddressZero,
    withdrawChannel.alice
  );
  // NOTE: MUST change this check for optimism (no native asset)
  // also, bc gas costs change across chain no real way to have a
  // reliable min other than 0
  if (nativeAsset.lte(0) && offchainFromAsset.lt(swappedAmount)) {
    throw new Error('Router has insufficient balance for gas');
  }
};
