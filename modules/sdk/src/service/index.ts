import {
  EngineEvents,
  ERC20Abi,
  FullChannelState,
} from '@connext/vector-types';
import { BrowserNode } from '@connext/vector-browser-node';
import { CHAIN_DETAIL, InitParamsSchema } from '../constants';
import {
  getChain,
  connectNode,
  createEvtContainer,
  EvtContainer,
  getChannelForChain,
  verifyAndGetRouterSupports,
} from '../utils';

export type ConnextNodeParamsSchema = {};

export class ConnextNode {
  public routerPublicIdentifier = '';
  public senderChainChannelAddress = '';
  public recipientChainChannelAddress = '';
  public senderChain?: CHAIN_DETAIL;
  public recipientChain?: CHAIN_DETAIL;
  public connextClient: BrowserNode | undefined;

  private evts?: EvtContainer;
  private swapDefination?: any;

  async init(params: InitParamsSchema) {
    this.routerPublicIdentifier = params.routerPublicIdentifier;

    let senderChainInfo: CHAIN_DETAIL;
    try {
      senderChainInfo = await getChain(
        params.senderChainId,
        params.senderChainProvider,
        params.senderAssetId
      );
      this.senderChain = senderChainInfo;
    } catch (e) {
      const message = 'Failed to fetch sender chain info';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    let recipientChainInfo: CHAIN_DETAIL;
    try {
      recipientChainInfo = await getChain(
        params.recipientChainId,
        params.recipientChainProvider,
        params.recipientAssetId
      );
      this.recipientChain = recipientChainInfo;
    } catch (e) {
      const message = 'Failed to fetch receiver chain info';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    // setup browser node
    let _node: BrowserNode;
    try {
      // browser node object
      _node =
        this.connextClient ??
        (await connectNode(
          params.routerPublicIdentifier,
          senderChainInfo.chainId,
          recipientChainInfo.chainId,
          senderChainInfo.chainProvider,
          recipientChainInfo.chainProvider,
          params.loginProvider,
          params.iframeSrcOverride
        ));
      this.connextClient = _node;
    } catch (e) {
      const message = 'Error initalizing Browser Node';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    console.log('INITIALIZED BROWSER NODE');

    const _evts = this.evts ?? createEvtContainer(_node);
    this.evts = _evts;

    let senderChainChannel: FullChannelState;
    try {
      senderChainChannel = await getChannelForChain(
        _node,
        params.routerPublicIdentifier,
        senderChainInfo.chainId
      );
      console.log('SETTING DepositChannel: ', senderChainChannel);
    } catch (e) {
      const message = 'Could not get sender channel';
      console.log(e, message);
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }
    const _senderChainChannelAddress = senderChainChannel!.channelAddress;
    this.senderChainChannelAddress = _senderChainChannelAddress;

    // Verify router supports...
    try {
      const swap = await verifyAndGetRouterSupports(
        _node,
        senderChainInfo.chainId,
        senderChainInfo.assetId,
        recipientChainInfo.chainId,
        recipientChainInfo.assetId,
        recipientChainInfo.rpcProvider,
        params.routerPublicIdentifier
      );
      this.swapDefination = swap;
    } catch (e) {
      const message = 'Error in verifyRouterSupports';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }
  }
}
