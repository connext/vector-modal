import { AddressZero } from "@ethersproject/constants";

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
    case 56: {
      return `https://bscscan.com`;
    }
    case 97: {
      return `https://testnet.bscscan.com`;
    }
    case 100: {
      return `https://blockscout.com/poa/xdai/`;
    }
    case 128: {
      return `https://scan.hecochain.com`;
    }
    case 137: {
      return `https://polygon-explorer-mainnet.chainstacklabs.com/`;
    }
    case 250: {
      return `https://ftmscan.com`;
    }
    case 80001: {
      return `https://explorer-mumbai.maticvigil.com`;
    }
    case 152709604825713: {
      return `https://explorer.offchainlabs.com/#`;
    }
    case 79377087078960: {
      return `https://explorer.offchainlabs.com/#`;
    }
  }
  return undefined;
};

export const getExplorerLinkForTx = (chainId: number, txHash: string): string => {
  const base = getExplorerLink(chainId);
  if (!base) {
    return "#";
  }
  return `${base}/tx/${txHash}`;
};

export const getExplorerLinkForAsset = (chainId: number, assetId: string): string => {
  const base = getExplorerLink(chainId);
  if (!base) {
    return "#";
  }
  if (assetId === AddressZero) {
    return base;
  }
  // BlockScout uses 'tokens' and not 'token'
  if (chainId === 137 || chainId === 80001) {
    return `${base}/tokens/${assetId}`;
  }
  return `${base}/token/${assetId}`;
};
