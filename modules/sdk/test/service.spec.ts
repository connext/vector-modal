import { BigNumber } from "@ethersproject/bignumber";
import { hexValue } from "@ethersproject/bytes";
import { JsonRpcProvider, Web3Provider, JsonRpcSigner } from "@ethersproject/providers";
import { AddressZero } from "@ethersproject/constants";
import Sinon, { createStubInstance } from "sinon";
import { AllowedSwap, Result } from "@connext/vector-types";
import { createTestChannelState, mkPublicIdentifier, expect, mkBytes32, getRandomBytes32 } from "@connext/vector-utils";

import * as helpers from "../src/utils/helpers";
import * as connextUtils from "../src/utils/connext";
import { BrowserNode, ChainDetail, ConnextSdk, TransferQuote } from "../src";

const generateChainDetail = (overrides: Partial<ChainDetail> = {}): ChainDetail => {
  return {
    name: overrides.name ?? "test network",
    chainId: overrides.chainId ?? 5,
    chainProvider: overrides.chainProvider ?? "http://dummyprovider",
    rpcProvider: overrides.rpcProvider ?? createStubInstance(JsonRpcProvider),
    assetDecimals: overrides.assetDecimals ?? 18,
    assetId: overrides.assetId ?? AddressZero,
    assetName: overrides.assetName ?? "test token",
    chainParams: {
      chainId: hexValue(overrides.chainId ?? 5),
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

const routerPublicIdentifier = mkPublicIdentifier("vectorRRR");
const senderChain = generateChainDetail();
const receiverChain = generateChainDetail({ chainId: 12 });
// const senderChannel = createTestChannelState("create");
const receiverChannel = createTestChannelState("create");
const transferQuote = {
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

let connext: ConnextSdk;
let getChainMock: Sinon.SinonStub;
let connectNodeMock: Sinon.SinonStub;
let createEvtContainerMock: Sinon.SinonStub;
let getChannelForChainMock: Sinon.SinonStub;
let requestCollateralMock: Sinon.SinonStub;
let getFeesDebouncedMock: Sinon.SinonStub;
let browserNodeMock: Sinon.SinonStubbedInstance<BrowserNode>;
let verifyAndGetRouterSupportsMock: Sinon.SinonStub;
let verifyRouterCapacityForTransferMock: Sinon.SinonStub;
let sendTransactionMock: Sinon.SinonStub;

describe("service", () => {
  beforeEach(() => {
    connext = new ConnextSdk();
    getChainMock = Sinon.stub(helpers, "getChain");
    browserNodeMock = Sinon.createStubInstance(BrowserNode);
    connectNodeMock = Sinon.stub(connextUtils, "connectNode");
    createEvtContainerMock = Sinon.stub(connextUtils, "createEvtContainer");
    getChannelForChainMock = Sinon.stub(connextUtils, "getChannelForChain");
    verifyAndGetRouterSupportsMock = Sinon.stub(connextUtils, "verifyAndGetRouterSupports");
    verifyRouterCapacityForTransferMock = Sinon.stub(connextUtils, "verifyRouterCapacityForTransfer");
    requestCollateralMock = Sinon.stub(connextUtils, "requestCollateral");
    sendTransactionMock = Sinon.stub(connextUtils, "onchainTransfer");
    getFeesDebouncedMock = Sinon.stub(connextUtils, "getFeesDebounced");

    browserNodeMock.sendIsAliveMessage.resolves(Result.ok({ channelAddress: AddressZero }));
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
      requestCollateralMock.onFirstCall().resolves({});
      requestCollateralMock.onSecondCall().resolves({});
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

    it("should throw an error if request collateral errors for sender channel", async () => {
      const errorMessage = "request collateral errors for sender channel";
      requestCollateralMock.onFirstCall().rejects(new Error(errorMessage));

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

    it("should throw an error if request collateral errors for receiver channel", async () => {
      const errorMessage = "request collateral errors for receiver channel";
      requestCollateralMock.onSecondCall().rejects(new Error(errorMessage));

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
    const ResTransferQuote = transferQuote;
    it("should return undefined if transferAmount is undefined", async () => {
      const res = await connext.estimateFees({ transferAmount: undefined });

      expect(res.error).to.be.undefined;
      expect(res.senderAmount).to.be.empty;
      expect(res.recipientAmount).to.be.empty;
      expect(res.totalFee).to.be.undefined;
      expect(res.transferQuote).to.be.undefined;
    });

    it("should error 'Invalid amount' if transferAmount is not numeric", async () => {
      const res = await connext.estimateFees({ transferAmount: "a1" });

      console.log(res);
      expect(res.error).to.be.deep.eq("Invalid amount");
    });

    it("should return helper text 'Transfer amount cannot be 0' if transferAmount is zero", async () => {
      const res = await connext.estimateFees({ transferAmount: "0" });

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
      const res = await connext.estimateFees({ transferAmount: "1" });

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
      const res = await connext.estimateFees({ transferAmount: "0.1" });

      console.log(res);
      expect(res.error).to.be.eq("Not enough amount to pay fees");
      expect(res.senderAmount).to.be.deep.eq("0.1");
      expect(res.recipientAmount).to.be.empty;
      expect(res.totalFee).to.be.be.eq("0.5");
      expect(res.transferQuote).to.be.eq(ResTransferQuote);
    });
  });

  describe("preTransferCheck", () => {
    let reconcileDepositMock: Sinon.SinonStub;

    beforeEach(() => {
      reconcileDepositMock = Sinon.stub(connextUtils, "reconcileDeposit");
      reconcileDepositMock.resolves();
    });

    afterEach(() => Sinon.restore());
    it("should error 'Transfer Amount is undefined' if transferAmount is undefiend", async () => {
      try {
        await connext.preTransferCheck("");
      } catch (e) {
        expect(e.message).to.be.eq("Transfer Amount is undefined");
      }
    });
    it("should error 'Transfer amount cannot be 0' if transferAmount is zero", async () => {
      try {
        await connext.preTransferCheck("0");
      } catch (e) {
        expect(e.message).to.be.eq("Transfer amount cannot be 0");
      }
    });

    it("should throw an error if reconcileDeposit errors", async () => {
      const errorMessage = "reconcileDeposit errors";
      reconcileDepositMock.rejects(new Error(errorMessage));
      try {
        await connext.preTransferCheck("1");
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.eq(errorMessage);
      }
    });

    it("should error if verifyRouterCapacityForTransfer errors", async () => {
      const errorMessage = "verifyRouterCapacityForTransfer errors";
      verifyRouterCapacityForTransferMock.rejects(new Error(errorMessage));
      try {
        await connext.preTransferCheck("1");
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.eq(errorMessage);
      }
    });

    it("should run if verifyRouterCapacityForTransfer resolves", async () => {
      verifyRouterCapacityForTransferMock.resolves();

      const res = await connext.preTransferCheck("1");

      expect(res).to.be.undefined;
    });
  });

  describe("deposit", () => {
    it.skip("should error if transaction is failed or reverted", async () => {
      verifyRouterCapacityForTransferMock.resolves();

      const webProviderMock = createStubInstance(Web3Provider);
      // let signerMock = createStubInstance(providers.JsonRpcSigner);
      const providerMock = createStubInstance(JsonRpcProvider);

      const signerMock = new JsonRpcSigner({}, providerMock);

      webProviderMock.getSigner.resolves(signerMock);
      const hash = mkBytes32("0xa");

      sendTransactionMock.resolves({
        hash,
        wait: () =>
          Promise.resolve({
            transactionHash: hash,
          } as any),
      } as any);

      signerMock.provider.waitForTransaction.resolves({ status: 0 } as any);

      try {
        await connext.deposit({ transferAmount: "1", webProvider: webProviderMock });
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.deep.eq("Transaction reverted onchain");
      }
    });
  });

  describe("transfer", () => {
    let reconcileDepositMock: Sinon.SinonStub;
    let createFromAssetTransferMock: Sinon.SinonStub;
    let resolveToAssetTransferMock: Sinon.SinonStub;

    beforeEach(() => {
      reconcileDepositMock = Sinon.stub(connextUtils, "reconcileDeposit");
      createFromAssetTransferMock = Sinon.stub(connextUtils, "createFromAssetTransfer");
      resolveToAssetTransferMock = Sinon.stub(connextUtils, "resolveToAssetTransfer");
    });

    afterEach(() => Sinon.restore());

    it("should throw an error if transferQuote is undefined", async () => {
      const errorMessage = "transfer quote is undefined";

      try {
        await connext.transfer({ transferQuote: {} as TransferQuote });
      } catch (e) {
        console.log(e);
        expect(e).to.be.ok;
        expect(e.message).to.be.deep.eq(errorMessage);
      }
    });

    it("should throw an error if reconcileDeposit errors", async () => {
      const errorMessage = "reconcileDeposit errors";
      reconcileDepositMock.rejects(new Error(errorMessage));

      try {
        await connext.transfer({ transferQuote: transferQuote });
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.deep.eq(errorMessage);
      }
    });

    it("should throw an error if createFromAssetTransfer errors", async () => {
      const errorMessage = "createFromAssetTransfer errors";
      reconcileDepositMock.resolves();
      createFromAssetTransferMock.rejects(new Error(errorMessage));

      try {
        await connext.transfer({ transferQuote: transferQuote });
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.deep.eq(errorMessage);
      }
    });

    // TODO: Add test for events
    // Add events mock
    it.skip("should throw an error if resolveToAssetTransfer errors", async () => {
      const transferId = getRandomBytes32();
      const preImage = getRandomBytes32();

      const errorMessage = "resolveToAssetTransfer errors";
      reconcileDepositMock.resolves();
      createFromAssetTransferMock.resolves({ transferId, preImage });

      resolveToAssetTransferMock.rejects(new Error(errorMessage));

      try {
        await connext.transfer({});
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.deep.eq(errorMessage);
      }
    });
  });

  describe("withdraw", () => {
    let withdrawToAssetMock: Sinon.SinonStub;

    beforeEach(() => {
      withdrawToAssetMock = Sinon.stub(connextUtils, "withdrawToAsset");
    });

    afterEach(() => Sinon.restore());

    it.skip("should throw an error if withdrawToAsset errors", async () => {
      const errorMessage = "withdrawToAsset errors";
      withdrawToAssetMock.rejects(new Error(errorMessage));

      try {
        await connext.withdraw({ recipientAddress: "0xa" });
      } catch (e) {
        expect(e).to.be.ok;
        expect(e.message).to.be.deep.eq(errorMessage);
      }
    });
    it.skip("should error if transaction is failed or reverted", async () => {});
  });

  describe("crossChainSwap", async () => {
    it.skip("should throw an error if transfer errors", async () => {});
    it.skip("should throw an error if withdraw errors", async () => {});
  });
});
