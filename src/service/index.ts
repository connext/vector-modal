import { ethers } from 'ethers';
import { BrowserNode } from '@connext/vector-browser-node';
import { iframeSrc } from '../constants';
import { swapSupportedByRouter } from '../utils';

declare global {
  interface Window {
    ethereum: any;
  }
}

class Connext {
  connextClient: BrowserNode | undefined;

  // Create methods
  async connectNode(
    connextNode: BrowserNode | undefined,
    routerPublicIdentifier: string,
    depositChainId: number,
    withdrawChainId: number,
    depositAssetId: string,
    withdrawAssetId: string,
    depositChainProvider: string,
    withdrawChainProvider: string
  ) {
    console.log('Connect Node');
    let browserNode: BrowserNode;
    if (!this.connextClient) {
      if (connextNode) {
        browserNode = connextNode;
      } else {
        browserNode = new BrowserNode({
          routerPublicIdentifier,
          iframeSrc,
          supportedChains: [depositChainId, withdrawChainId],
          chainProviders: {
            [depositChainId]: depositChainProvider,
            [withdrawChainId]: withdrawChainProvider,
          },
        });
      }

      await browserNode.init();
      // once you have the browser node, make sure the swap is supported
      // by the connected router before creating channels
      const config = await browserNode.getRouterConfig({
        routerIdentifier: routerPublicIdentifier,
      });
      if (config.isError) {
        throw config.getError();
      }
      swapSupportedByRouter(
        depositChainId,
        withdrawChainId,
        depositAssetId,
        withdrawAssetId,
        config.getValue()
      );
      this.connextClient = browserNode;

      console.log('connection success');
    }

    const configRes = await this.connextClient.getConfig();
    if (!configRes[0])
      throw new Error(`Error getConfig: node connection failed`);

    console.log('GET CONFIG: ', configRes[0]);
  }

  async basicSanitation(params: {
    value?: string;
    fromChainId?: number;
    fromAssetId?: string;
    toChainId?: number;
    toAssetId?: string;
    withdrawalAddress?: string;
  }) {
    if (!this.connextClient) {
      throw new Error('iframe Connection failed');
    }
    if (params.value) {
      if (ethers.utils.parseEther(params.value).isZero()) {
        throw new Error("Value can't be zero");
      }
    }

    if (params.withdrawalAddress) {
      if (!ethers.utils.isAddress(params.withdrawalAddress)) {
        throw new Error('Invalid Recipient Address');
      }
    }
    console.log('Valid params');
  }

  async crossTransfer(
    value: string,
    senderChainId: number,
    senderAssetId: string,
    recipientChainId: number,
    recipientAssetId: string,
    withdrawalAddress: string,
    crossChainTransferId: string
  ) {
    await this.basicSanitation({
      fromChainId: senderChainId,
      fromAssetId: senderAssetId,
      toChainId: recipientChainId,
      toAssetId: recipientAssetId,
      value: value,
      withdrawalAddress: withdrawalAddress,
    });

    const params = {
      amount: value,
      fromChainId: senderChainId,
      fromAssetId: senderAssetId,
      toChainId: recipientChainId,
      toAssetId: recipientAssetId,
      reconcileDeposit: true,
      withdrawalAddress: withdrawalAddress,
      meta: { crossChainTransferId },
    };

    let result;
    try {
      result = await this.connextClient!.crossChainTransfer(params);
    } catch (e) {
      throw new Error(`${e}`);
    }
    console.log('CrossChain transfer is successful');
    const transaction = `${result.withdrawalTx}`;
    const transferAmount = `${result.withdrawalAmount}`;
    return { transaction, transferAmount };
  }
}

export const connext = new Connext();
