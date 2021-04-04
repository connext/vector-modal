import { BrowserNode, CHAIN_DETAIL, ConnextSdk } from "../src";
import { utils, providers } from "ethers";
import Sinon, { createStubInstance } from "sinon";
import { AllowedSwap, Result } from "@connext/vector-types";
import { createTestChannelState, mkPublicIdentifier, expect } from "@connext/vector-utils";
import * as helpers from "../src/utils/helpers";
import * as connextUtils from "../src/utils/connext";

import { constants } from "ethers";

const generateChainDetail = (overrides: Partial<CHAIN_DETAIL> = {}): CHAIN_DETAIL => {
  return {
    name: overrides.name ?? "test network",
    chainId: overrides.chainId ?? 5,
    chainProvider: overrides.chainProvider ?? "http://dummyprovider",
    rpcProvider: overrides.rpcProvider ?? createStubInstance(providers.JsonRpcProvider),
    assetDecimals: overrides.assetDecimals ?? 18,
    assetId: overrides.assetId ?? constants.AddressZero,
    assetName: overrides.assetName ?? "TToken",
    chainParams: {
      chainId: utils.hexValue(overrides.chainId ?? 5),
      chainName: "test network",
      nativeCurrency: {
        name: "test token",
        symbol: "test",
        decimals: 18,
      },
      rpcUrls: [""],
    },
  };
};

let connext: ConnextSdk;
let getChainMock: Sinon.SinonStub;
let connectNodeMock: Sinon.SinonStub;
let createEvtContainerMock: Sinon.SinonStub;
let getChannelForChainMock: Sinon.SinonStub;
let browserNodeMock: Sinon.SinonStubbedInstance<BrowserNode>;
let verifyAndGetRouterSupportsMock: Sinon.SinonStub;

describe("service", () => {
  const routerPublicIdentifier = mkPublicIdentifier("vectorRRR");

  beforeEach(() => {
    connext = new ConnextSdk();
    getChainMock = Sinon.stub(helpers, "getChain");
    browserNodeMock = Sinon.createStubInstance(BrowserNode);
    connectNodeMock = Sinon.stub(connextUtils, "connectNode");
    createEvtContainerMock = Sinon.stub(connextUtils, "createEvtContainer");
    getChannelForChainMock = Sinon.stub(connextUtils, "getChannelForChain");
    verifyAndGetRouterSupportsMock = Sinon.stub(connextUtils, "verifyAndGetRouterSupports");

    browserNodeMock.sendIsAliveMessage.resolves(Result.ok({ channelAddress: constants.AddressZero }));
    connext.browserNode = browserNodeMock as any;
  });

  afterEach(() => Sinon.restore());

  describe("setup", () => {
    const senderChain = generateChainDetail();
    const receiverChain = generateChainDetail({ chainId: 12 });
    const senderChannel = createTestChannelState("create");
    const receiverChannel = createTestChannelState("create");

    beforeEach(async () => {
      getChainMock.onFirstCall().resolves(senderChain);
      getChainMock.onSecondCall().resolves(receiverChain);

      connectNodeMock.resolves(browserNodeMock as any);
      createEvtContainerMock.resolves({});
      getChannelForChainMock.onFirstCall().resolves(senderChannel.channel);
      getChannelForChainMock.onSecondCall().resolves(receiverChannel.channel);
    });

    it.only("should throw an error if sender chain doesnt exist", async () => {
      getChainMock.onFirstCall().rejects();

      try {
        await connext.setup({
          loginProvider: {},
          senderAssetId: senderChain.assetId,
          senderChainProvider: senderChain.chainProvider,
          recipientAssetId: receiverChain.assetId,
          recipientChainProvider: receiverChain.chainProvider,
          routerPublicIdentifier,
        });
      } catch (e) {
        expect(e).to.be.ok;
      }
    });

    it("should throw an error if receiver chain doesnt exist", async () => {});
    it("should throw an error if sender channel doesnt exist", async () => {});
    it("should throw an error if receiver channel doesnt exist", async () => {});
    it("should throw an error if browser node cant connect", async () => {});
    it("should throw an error if verify router supports errors", async () => {});

    it("should set up with browser node already part of class", async () => {
      verifyAndGetRouterSupportsMock.resolves({
        fromAssetId: senderChain.assetId,
        fromChainId: senderChain.chainId,
        hardcodedRate: "1",
        priceType: "hardcoded",
        toAssetId: receiverChain.assetId,
        toChainId: receiverChain.chainId,
      } as AllowedSwap);

      const res = await connext.setup({
        loginProvider: {},
        senderAssetId: senderChain.assetId,
        senderChainProvider: senderChain.chainProvider,
        recipientAssetId: receiverChain.assetId,
        recipientChainProvider: receiverChain.chainProvider,
        routerPublicIdentifier,
      });
      console.log("res: ", res);
      expect(res).to.be.undefined;
    });
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
