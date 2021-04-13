import { BrowserNode, CHAIN_DETAIL, ConnextSdk } from "../src";
import { utils, providers, BigNumber } from "ethers";
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
    assetName: overrides.assetName ?? "test token",
    chainParams: {
      chainId: utils.hexValue(overrides.chainId ?? 5),
      chainName: overrides.name ?? "test network",
      nativeCurrency: {
        name: overrides.assetName ?? "test token",
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
let getFeesDebouncedMock: Sinon.SinonStub;
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
    getFeesDebouncedMock = Sinon.stub(connextUtils, "getFeesDebounced");

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

    it("should throw an error if sender chain doesnt exist", async () => {
      const errorMessage = "sender chain does not exist";
      getChainMock.onFirstCall().rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.undefined;
    });

    it("should throw an error if receiver chain doesnt exist", async () => {
      const errorMessage = "receiver chain does not exist";
      getChainMock.onSecondCall().rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.undefined;
    });

    it("should throw an error if browser node can't connect", async () => {
      const errorMessage = "browser node can't connect";
      connectNodeMock.rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
      expect(connext.browserNode).to.be.empty;
    });

    it("should throw an error if sender channel doesnt exist", async () => {
      const errorMessage = "sender channel does not exist";
      getChannelForChainMock.onFirstCall().rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
      expect(connext.browserNode).to.be.deep.eq(browserNodeMock);
      expect(connext.senderChainChannel).to.be.undefined;
      expect(connext.senderChainChannelAddress).to.be.eq("");
    });

    it("should throw an error if receiver channel doesnt exist", async () => {
      const errorMessage = "receiver channel does not exist";
      getChannelForChainMock.onSecondCall().rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
      expect(connext.browserNode).to.be.deep.eq(browserNodeMock);
      expect(connext.senderChainChannelAddress).to.be.deep.eq(senderChannel.channel.latestUpdate.channelAddress);
      expect(connext.senderChainChannel).to.be.deep.eq(senderChannel.channel);
      expect(connext.recipientChainChannelAddress).to.be.eq("");
      expect(connext.recipientChainChannel).to.be.undefined;
    });

    it("should throw an error if verify router supports errors", async () => {
      const errorMessage = "Error in verifyRouterSupports";
      verifyAndGetRouterSupportsMock.rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
      expect(connext.browserNode).to.be.deep.eq(browserNodeMock);
      expect(connext.senderChainChannelAddress).to.be.deep.eq(senderChannel.channel.latestUpdate.channelAddress);
      expect(connext.recipientChainChannelAddress).to.be.deep.eq(receiverChannel.channel.latestUpdate.channelAddress);
      expect(connext.senderChainChannel).to.be.deep.eq(senderChannel.channel);
      expect(connext.recipientChainChannel).to.be.deep.eq(receiverChannel.channel);
    });

    it("should throw an error if loginProvider is undefined", async () => {
      verifyAndGetRouterSupportsMock.resolves({
        fromAssetId: senderChain.assetId,
        fromChainId: senderChain.chainId,
        hardcodedRate: "1",
        priceType: "hardcoded",
        toAssetId: receiverChain.assetId,
        toChainId: receiverChain.chainId,
      } as AllowedSwap);

      try {
        await connext.setup({
          loginProvider: undefined,
          senderAssetId: senderChain.assetId,
          senderChainProvider: senderChain.chainProvider,
          recipientAssetId: receiverChain.assetId,
          recipientChainProvider: receiverChain.chainProvider,
          routerPublicIdentifier,
        });
      } catch (e) {
        expect(e.message).to.be.deep.eq("Error loginProvider is undefined");
        expect(e).to.be.ok;
      }

      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
    });

    // ToDo
    it("should throw an error if createEvtContainer errors", async () => {
      const errorMessage = "evt container errors";
      createEvtContainerMock.rejects(new Error(errorMessage));

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
        expect(e.message).to.be.deep.eq(errorMessage);
        expect(e).to.be.ok;
      }
      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
      expect(connext.browserNode).to.be.deep.eq(browserNodeMock);
    });

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
      expect(connext.routerPublicIdentifier).to.be.deep.eq(routerPublicIdentifier);
      expect(connext.senderChain).to.be.deep.eq(senderChain);
      expect(connext.recipientChain).to.be.deep.eq(receiverChain);
      expect(connext.browserNode).to.be.deep.eq(browserNodeMock);
      expect(connext.senderChainChannelAddress).to.be.deep.eq(senderChannel.channel.latestUpdate.channelAddress);
      expect(connext.recipientChainChannelAddress).to.be.deep.eq(receiverChannel.channel.latestUpdate.channelAddress);
      expect(connext.senderChainChannel).to.be.deep.eq(senderChannel.channel);
      expect(connext.recipientChainChannel).to.be.deep.eq(receiverChannel.channel);
    });
  });

  describe("estimateFees", () => {
    const senderChain = generateChainDetail();
    const receiverChain = generateChainDetail({ chainId: 12 });
    const senderChannel = createTestChannelState("create");
    const receiverChannel = createTestChannelState("create");
    const ResTransferQuote = {
      routerIdentifier: routerPublicIdentifier,
      amount: "1000000000000000000",
      assetId: senderChain.assetId,
      chainId: senderChain.chainId,
      recipient: receiverChannel.channel.bobIdentifier,
      recipientChainId: receiverChain.chainId,
      recipientAssetId: receiverChain.assetId,
      fee: "500000000000000000",
      expiry: "1618308505485",
      signature:
        "0xa36cfa752b57e4f35d9af5c8aab4a78dfc336edfb635850e1df2c99c558604b46d0e8686de9590db6f18a500e36014d00acb31b0f738dab2574180805db64fdc1b",
    };

    it("should return undefined if transferAmount is undefined", async () => {
      var res = await connext.estimateFees({ transferAmount: undefined });

      expect(res.error).to.be.undefined;
      expect(res.senderAmount).to.be.empty;
      expect(res.recipientAmount).to.be.empty;
      expect(res.totalFee).to.be.undefined;
      expect(res.transferQuote).to.be.undefined;
    });

    it("should error 'Invalid amount' if transferAmount is not numeric", async () => {
      var res = await connext.estimateFees({ transferAmount: "a1" });

      console.log(res);
      expect(res.error).to.be.deep.eq("Invalid amount");
    });

    it("should return helper text 'Transfer amount cannot be 0' if transferAmount is zero", async () => {
      var res = await connext.estimateFees({ transferAmount: "0" });

      console.log(res);
      expect(res.error).to.be.deep.eq("Transfer amount cannot be 0");
      expect(res.senderAmount).to.be.deep.eq("0");
      expect(res.recipientAmount).to.be.empty;
      expect(res.totalFee).to.be.undefined;
      expect(res.transferQuote).to.be.undefined;
    });

    it("should return fees if transferAmount is numeric string", async () => {
      getFeesDebouncedMock.resolves({
        transferQuote: ResTransferQuote,
        totalFee: BigNumber.from("500000000000000000"),
        senderAmount: BigNumber.from("1000000000000000000"),
        recipientAmount: BigNumber.from("500000000000000000"),
      });
      var res = await connext.estimateFees({ transferAmount: "1" });

      console.log(res);
      expect(res.error).to.be.undefined;
      expect(res.senderAmount).to.be.deep.eq("1");
      expect(res.recipientAmount).to.be.eq("0.5");
      expect(res.totalFee).to.be.be.eq("0.5");
      expect(res.transferQuote).to.be.eq(ResTransferQuote);
    });

    it("should return helper text 'Not enough amount to pay fees' if transferAmount is lower than fees estimateFees", async () => {
      getFeesDebouncedMock.resolves({
        transferQuote: ResTransferQuote,
        totalFee: BigNumber.from("500000000000000000"),
        senderAmount: BigNumber.from("100000000000000000"),
        recipientAmount: BigNumber.from("0"),
      });
      var res = await connext.estimateFees({ transferAmount: "0.1" });

      console.log(res);
      expect(res.error).to.be.eq("Not enough amount to pay fees");
      expect(res.senderAmount).to.be.deep.eq("0.1");
      expect(res.recipientAmount).to.be.empty;
      expect(res.totalFee).to.be.be.eq("0.5");
      expect(res.transferQuote).to.be.eq(ResTransferQuote);
    });

    it("should return helper text 'Transfer amount exceeds user balance' if transferAmount is lower than fees userBalance", async () => {});
  });

  describe("preTransferCheck", () => {
    it.skip("should error 'Transfer Amount is undefined' if transferAmount is undefiend", async () => {});
    it.skip("should error 'Transfer amount cannot be 0' if transferAmount is zero", async () => {});
    it.skip("should error if transferAmount is greater than the router's liquidity", async () => {});
  });

  describe("deposit", () => {
    it.skip("should error webProvider is undefined", async () => {});
    it.skip("should error if init or setup function is not called", async () => {});
    it.skip("should error if transaction is failed or reverted", async () => {});
    it.skip("should be able to deposit ERC20", async () => {});
    it.skip("should be able to deposit ETH", async () => {});
  });

  describe("transfer", () => {
    it.skip("should error if init or setup function is not called", async () => {});
    it.skip("should throw an error if reconcileDeposit errors", async () => {});
    it.skip("should throw an error if createFromAssetTransfer errors", async () => {});
    it.skip("should throw an error if resolveToAssetTransfer errors", async () => {});
  });

  describe("withdraw", () => {
    it.skip("should throw an error if withdrawToAsset errors", async () => {});
    it.skip("should error if transaction is failed or reverted", async () => {});
  });

  describe("crossChainSwap", () => async () => {
    it.skip("should throw an error if transfer errors", async () => {});
    it.skip("should throw an error if withdraw errors", async () => {});
  });
});
