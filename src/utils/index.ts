export const getExplorerLinkForTx = (
  chainId: number,
  txHash: string
): string => {
  switch (chainId) {
    case 1: {
      return `https://etherscan.io/tx/${txHash}`;
    }
    case 4: {
      return `https://rinkeby.etherscan.io/tx/${txHash}`;
    }
    case 5: {
      return `https://goerli.etherscan.io/tx/${txHash}`;
    }
    case 42: {
      return `https://kovan.etherscan.io/tx/${txHash}`;
    }
    case 80001: {
      return `https://explorer-mumbai.maticvigil.com/tx/${txHash}`;
    }
    case 152709604825713: {
      return `https://explorer.offchainlabs.com/#/tx/${txHash}`;
    }
  }
  return '#';
};

export const getProviderUrlForChain = (chainId: number): string | undefined => {
  switch (chainId) {
    case 5: {
      return `https://goerli.prylabs.net`;
    }
    case 80001: {
      return `https://rpc-mumbai.matic.today`;
    }
    case 152709604825713: {
      return `https://kovan2.arbitrum.io/rpc`;
    }
  }
  return undefined;
};
