import {
  BrowserNode,
  CHAIN_DETAIL,
  ConnextSdk,
  //   SetupParamsSchema,
} from "../src";
import { utils, providers } from "ethers";
import { expect } from "chai";
import Sinon from "sinon";
import { Evt } from "evt";
import { ConditionalTransferCreatedPayload, TransferNames, UpdateType } from "@connext/vector-types";
import { createTestChannelState, getRandomBytes32, mkPublicIdentifier, mkAddress } from "@connext/vector-utils";
// import {  } from '@connext/vector-utils';
import * as helpers from "../src/utils/helpers";
import * as connextUtils from "../src/utils/connext";

// import { env } from './env';
import { constants } from "ethers";

describe("@connext/vector-sdk", () => {
  let connext: ConnextSdk;
  let getChainMock: Sinon.SinonStub;
  let connectNodeMock: Sinon.SinonStub;
  let createEvtContainerMock: Sinon.SinonStub;
  let getChannelForChainMock: Sinon.SinonStub;
  let browserNodeMock: Sinon.SinonStubbedInstance<BrowserNode>;

  const routerPublicIdentifier = mkPublicIdentifier("vectorRRR");
  const aliceIdentifier = mkPublicIdentifier("vectorA");
  const bobIdentifier = mkPublicIdentifier("vectorB");
  const signerAddress = mkAddress("0xBBB");

  beforeEach(() => {
    connext = new ConnextSdk();
    getChainMock = Sinon.stub(helpers, "getChain");
    browserNodeMock = Sinon.createStubInstance(BrowserNode);
    connectNodeMock = Sinon.stub(connextUtils, "connectNode");
    createEvtContainerMock = Sinon.stub(connextUtils, "createEvtContainer");
    getChannelForChainMock = Sinon.stub(connextUtils, "getChannelForChain");
  });

  afterEach(() => Sinon.restore());

  it("happy case", () => {
    expect(connext.senderChainChannelAddress).to.be.a("string");
    expect(true).to.be.true;
  });

  const generateDefaultTestContext = (): TransferCreatedTestContext => {
    const transferMeta = {
      routingId: getRandomBytes32(),
      path: [{ recipient: bobIdentifier }],
    };
    const { channel: senderChannel, transfer: senderTransfer } = createTestChannelState(
      UpdateType.create,
      {
        aliceIdentifier: routerPublicIdentifier,
        bobIdentifier: aliceIdentifier,
        alice: signerAddress,
        bob: mkAddress("0xeee"),
        latestUpdate: {
          fromIdentifier: bobIdentifier,
          toIdentifier: aliceIdentifier,
        },
      },
      {
        meta: transferMeta,
        initiator: mkAddress("0xeee"),
        assetId: realConfig.vectorConfig.allowedSwaps[0].fromAssetId,
        chainId: realConfig.vectorConfig.allowedSwaps[0].fromChainId,
      },
    );

    const { channel: receiverChannel } = createTestChannelState(UpdateType.deposit, {
      aliceIdentifier: routerPublicIdentifier,
      bobIdentifier,
      alice: signerAddress,
    });

    const idx = senderChannel.assetIds.findIndex((a: any) => a === senderTransfer.assetId);

    const event: ConditionalTransferCreatedPayload = {
      aliceIdentifier: senderChannel.aliceIdentifier,
      bobIdentifier: senderChannel.bobIdentifier,
      channelAddress: senderChannel.channelAddress,
      channelBalance: senderChannel.balances[idx],
      activeTransferIds: [senderTransfer.transferId],
      transfer: senderTransfer,
      conditionType: TransferNames.HashlockTransfer,
    };
    return { event, senderTransfer, senderChannel, receiverChannel };
  };

  it("setup function", async () => {
    // sender chain
    const name = "test network";
    const assetName = "TToken";
    const chainProvider = "http://dummyprovider";
    const chainId = 5;
    const validAddress = constants.AddressZero;
    getChainMock.onFirstCall().resolves({
      name: name,
      chainId: chainId,
      chainProvider: chainProvider,
      rpcProvider: new providers.JsonRpcProvider(chainProvider, chainId),
      assetDecimals: 18,
      assetId: validAddress,
      assetName: assetName,
      chainParams: {
        chainId: utils.hexValue(chainId),
        chainName: name,
        nativeCurrency: {
          name: "test token",
          symbol: "test",
          decimals: 18,
        },
        rpcUrls: [""],
      },
    } as CHAIN_DETAIL);

    getChainMock.onSecondCall().resolves({
      name: name,
      chainId: chainId,
      chainProvider: chainProvider,
      rpcProvider: new providers.JsonRpcProvider(chainProvider, chainId),
      assetDecimals: 18,
      assetId: validAddress,
      assetName: assetName,
      chainParams: {
        chainId: utils.hexValue(chainId),
        chainName: name,
        nativeCurrency: {
          name: "test token",
          symbol: "test",
          decimals: 18,
        },
        rpcUrls: [""],
      },
    } as CHAIN_DETAIL);

    connectNodeMock.resolves(browserNodeMock as any);
    // createEvtContainerMock.resolves({
    //     [EngineEvents.CONDITIONAL_TRANSFER_CREATED]: Evt<ConditionalTransferCreatedPayload>,
    //     [EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]: Evt<ConditionalTransferResolvedPayload>,
    //     [EngineEvents.DEPOSIT_RECONCILED]: Evt<DepositReconciledPayload>,
    //     [EngineEvents.WITHDRAWAL_RECONCILED]: Evt<WithdrawalReconciledPayload>,
    //     [EngineEvents.WITHDRAWAL_RESOLVED]: Evt<WithdrawalResolvedPayload>,
    //   })
    getChannelForChainMock.resolves();
  });

  //   it('init function', async () => {
  //     const setParams: SetupParamsSchema = {
  //       routerPublicIdentifier: routerPublicIdentifier,
  //       loginProvider: loginProvider,
  //       senderChainProvider: senderChainProvider,
  //       senderAssetId: senderAssetId,
  //       recipientChainProvider: recipientChainProvider,
  //       recipientAssetId: recipientAssetId,
  //       senderChainId: senderChainId,
  //       recipientChainId: recipientChainId,
  //     };

  //     try {
  //       await connext.init(setParams);
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   });
});
