import { ethers } from 'ethers';
import { BrowserNode } from '@connext/vector-browser-node';
import {
  DEFAULT_TRANSFER_TIMEOUT,
  ConditionalTransferCreatedPayload,
  FullChannelState,
  TransferNames,
} from '@connext/vector-types';
import { createlockHash, getRandomBytes32 } from '@connext/vector-utils';
import { iframeSrc } from '../constants';

declare global {
  interface Window {
    ethereum: any;
  }
}

class Connext {
  connextClient: BrowserNode | undefined;
  config:
    | {
        publicIdentifier: string;
        signerAddress: string;
        index: number;
      }
    | undefined;

  // Create methods
  async connectNode(
    connextNode: BrowserNode | undefined,
    routerPublicIdentifier: string,
    depositChainId: number,
    withdrawChainId: number
  ) {
    console.log('Connect Node');
    let browserNode: BrowserNode;
    if (!this.connextClient) {
      try {
        if (connextNode) {
          browserNode = connextNode;
        } else {
          browserNode = new BrowserNode({
            routerPublicIdentifier,
            iframeSrc,
            supportedChains: [depositChainId, withdrawChainId],
          });
        }
        await browserNode.init();
        this.connextClient = browserNode;
      } catch (e) {
        console.error(e);
        throw new Error(`connecting to iframe: ${e}`);
      }
      console.log('connection success');
    }

    const configRes = await this.connextClient.getConfig();
    if (!configRes[0])
      throw new Error(`Error getConfig: node connection failed`);

    console.log('GET CONFIG: ', configRes[0]);
    this.config = configRes[0];
  }

  async updateChannel(channelAddress: string): Promise<FullChannelState> {
    const res = await this.connextClient!.getStateChannel({ channelAddress });
    if (res.isError) {
      throw new Error(`Error getting state channel ${res.getError()}`);
    }
    const channel = res.getValue() as FullChannelState;
    console.log('Updated channel:', channel);
    return channel;
  }

  async getChannelByParticipants(
    publicIdentifier: string,
    counterparty: string,
    chainId: number
  ): Promise<FullChannelState> {
    let channelState: any;
    const res = await this.connextClient!.getStateChannelByParticipants({
      publicIdentifier: publicIdentifier,
      counterparty: counterparty,
      chainId: chainId,
    });
    if (res.isError) {
      throw new Error(
        `Error getting state channel by participants ${res.getError()}`
      );
    }
    channelState = res.getValue();
    return channelState;
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

    if (!this.config) {
      throw new Error('Node Connection failed');
    }

    if (!this.config.publicIdentifier) {
      throw new Error('user publicIdentifier missing');
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

  async reconcileDeposit(channelAddress: string, assetId: string) {
    const depositRes = await this.connextClient!.reconcileDeposit({
      channelAddress: channelAddress,
      assetId,
    });
    if (depositRes.isError) {
      throw new Error(`Error reconciling deposit: ${depositRes.getError()}`);
    }
    console.log(`Deposit reconciled: ${JSON.stringify(depositRes.getValue())}`);
  }

  async transfer(
    senderChainId: number,
    senderAssetId: string,
    value: string,
    recipientChainId: number,
    recipientAssetId: string,
    routerPublicIdentifier: string
  ) {
    await this.basicSanitation({
      fromChainId: senderChainId,
      fromAssetId: senderAssetId,
      toChainId: recipientChainId,
      toAssetId: recipientAssetId,
      value: value,
    });

    const recipient = this.config!.publicIdentifier;
    const preImage = getRandomBytes32();
    const amount = ethers.utils.parseEther(value);

    const senderChannelState = await this.getChannelByParticipants(
      this.config!.publicIdentifier,
      routerPublicIdentifier,
      senderChainId
    );
    const receiverChannelState = await this.getChannelByParticipants(
      this.config!.publicIdentifier,
      routerPublicIdentifier,
      recipientChainId
    );
    console.log(
      `Sending ${value} from ${senderChannelState.channelAddress} to ${receiverChannelState.channelAddress} using preImage ${preImage}`
    );

    const event: Promise<ConditionalTransferCreatedPayload> = new Promise(
      res => {
        this.connextClient!.on('CONDITIONAL_TRANSFER_CREATED', payload => {
          if (payload.channelAddress !== receiverChannelState.channelAddress) {
            return;
          }
          console.log(`Received CONDITIONAL_TRANSFER_CREATED event: `, payload);
          res(payload);
        });
      }
    );
    const transferRes = await this.connextClient!.conditionalTransfer({
      type: TransferNames.HashlockTransfer,
      channelAddress: senderChannelState.channelAddress,
      assetId: senderAssetId,
      amount: amount.toString(),
      recipient,
      recipientChainId: recipientChainId,
      recipientAssetId: recipientAssetId,
      details: {
        lockHash: createlockHash(preImage),
        expiry: '0',
      },
      timeout: DEFAULT_TRANSFER_TIMEOUT.toString(),
      meta: {},
    });
    if (transferRes.isError) {
      throw new Error(`Error transferring: ${transferRes.getError()}`);
    }

    console.log(
      `Transfer from for chain: ${senderChainId} to chain ${recipientChainId} :`,
      transferRes.getValue()
    );
    const receivedTransfer = await event;
    console.log(
      `Received transfer ${JSON.stringify(
        receivedTransfer.transfer
      )}, resolving...`
    );
    const resolveRes = await this.connextClient!.resolveTransfer({
      channelAddress: receiverChannelState.channelAddress,
      transferResolver: {
        preImage: preImage,
      },
      transferId: receivedTransfer.transfer.transferId,
    });
    if (resolveRes.isError) {
      throw new Error(`Error resolving transfer: ${resolveRes.getError()}`);
    }

    console.log(`successfuly resolved transfer:, `, resolveRes.getValue());
    await this.updateChannel(senderChannelState.channelAddress);
    await this.updateChannel(receiverChannelState.channelAddress);

    return `Successful transfer from chain: ${senderChainId} to chain ${recipientChainId}`;
  }

  async withdraw(
    recipientChainId: number,
    receiverAssetId: string,
    receiverAddress: string,
    value: string,
    routerPublicIdentifier: string
  ) {
    await this.basicSanitation({
      toChainId: recipientChainId,
      toAssetId: receiverAssetId,
      value: value,
      withdrawalAddress: receiverAddress,
    });

    const amount = ethers.utils.parseEther(value).toString();

    const channelState = await this.getChannelByParticipants(
      this.config!.publicIdentifier,
      routerPublicIdentifier,
      recipientChainId
    );

    const requestRes = await this.connextClient!.withdraw({
      channelAddress: channelState.channelAddress,
      assetId: receiverAssetId,
      amount,
      recipient: receiverAddress,
    });
    if (requestRes.isError) {
      throw new Error(`Error withdrawing: ${requestRes.getError()}`);
    }
    console.log(`successfuly withdraw: `, requestRes.getValue());

    await this.updateChannel(channelState.channelAddress);
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

    // const amount = ethers.utils.parseEther(value).toString();

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
