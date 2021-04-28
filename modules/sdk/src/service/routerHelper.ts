import { BrowserNode, NonEIP712Message } from "@connext/vector-browser-node";
import { ChainProviders, FullChannelState } from "@connext/vector-types";
import { getBalanceForAssetId } from "@connext/vector-utils";
import { BigNumber } from "@ethersproject/bignumber";
import { JsonRpcSigner } from "@ethersproject/providers";
import { getChannelForChain } from "../utils";

import { iframeSrc } from "../constants";

export class routerHelper {
  public routerPublicIdentifier = "";
  public browserNode?: BrowserNode;
  public chainChannels?: { [chainId: number]: FullChannelState };

  // initiate node for all the chains
  async init(params: {
    routerPublicIdentifier: string; // "vectorA876de..."
    loginProvider: any;
    chainProviders: ChainProviders;
  }): Promise<void> {
    const { routerPublicIdentifier, chainProviders, loginProvider } = params;
    this.routerPublicIdentifier = routerPublicIdentifier;

    const supportedChains = Object.keys(chainProviders).map(s => Number(s));
    console.log(supportedChains);

    const browserNode = new BrowserNode({
      routerPublicIdentifier,
      iframeSrc: iframeSrc,
      supportedChains: supportedChains,
      chainProviders: chainProviders,
    });

    this.browserNode = browserNode;

    let signature: string | undefined;
    let signer: JsonRpcSigner | undefined;
    let signerAddress: string | undefined;

    if (loginProvider) {
      console.warn("Using login provider to log in");
      signer = loginProvider.getSigner();
      signerAddress = await signer.getAddress();
      signature = await signer.signMessage(NonEIP712Message);
      console.log("signerAddress: ", signerAddress);
      console.log("signature: ", signature);
    } else {
      throw new Error("couldn't found loginProvider");
    }

    try {
      await browserNode.init({
        signature,
        signer: signerAddress,
      });
    } catch (e) {
      console.log("error during browserNode init:", e);
      throw e;
    }

    const configRes = await browserNode.getConfig();
    if (!configRes[0]) throw new Error(`Error getConfig: node connection failed`);

    console.log("browser node config: ", configRes[0]);

    try {
      supportedChains.map(async chainId => {
        let channel: FullChannelState = await getChannelForChain(browserNode, routerPublicIdentifier, chainId);
        console.log("Get channel: ", channel);

        this.chainChannels[chainId] = channel;
      });
    } catch (e) {
      const message = "Could not get channel";
      console.log(e, message);
      throw e;
    }

    console.log(this.chainChannels);
  }

  async getOffChainChannelBalance(
    chainId: number,
    assetId: string,
  ): Promise<{
    offChainAssetBalanceBn: BigNumber;
  }> {
    const channel = this.chainChannels[chainId];

    const offChainAssetBalance = BigNumber.from(getBalanceForAssetId(channel, assetId, "bob"));
    console.log(
      `Offchain balance for ${channel.channelAddress} of asset ${assetId}: ${offChainAssetBalance.toString()}`,
    );

    return {
      offChainAssetBalanceBn: offChainAssetBalance,
    };
  }
}
