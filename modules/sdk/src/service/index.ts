import {
  EngineEvents,
  FullChannelState,
  ERC20Abi,
  TransferQuote,
  WithdrawalQuote,
  ChainInfo,
} from "@connext/vector-types";
import { BrowserNode } from "@connext/vector-browser-node";
import { getBalanceForAssetId, getRandomBytes32, getAssetDecimals, getChainInfo } from "@connext/vector-utils";
import { BigNumber, Contract, constants, utils } from "ethers";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {
  CHAIN_DETAIL,
  ASSET_DETAIL,
  SetupParamsSchema,
  InitParamsSchema,
  EstimateFeeParamsSchema,
  preTransferCheckParamsSchema,
  EstimateFeeResponseSchema,
  DepositParamsSchema,
  TransferParamsSchema,
  WithdrawParamsSchema,
  CrossChainSwapParamsSchema,
  CheckPendingTransferResponseSchema,
  InitResponseSchema,
} from "../constants";
import {
  getChain,
  connectNode,
  createEvtContainer,
  EvtContainer,
  getChannelForChain,
  verifyAndGetRouterSupports,
  reconcileDeposit,
  cancelHangingToTransfers,
  waitForSenderCancels,
  getCrosschainFee,
  verifyRouterCapacityForTransfer,
  createFromAssetTransfer,
  resolveToAssetTransfer,
  withdrawToAsset,
  cancelToAssetTransfer,
} from "../utils";

export { BrowserNode, ERC20Abi, FullChannelState, getBalanceForAssetId, TransferQuote, WithdrawalQuote };

export class ConnextSdk {
  public routerPublicIdentifier = "";
  public senderChainChannelAddress = "";
  public recipientChainChannelAddress = "";
  public crossChainTransferId = "";
  public senderChainChannel?: FullChannelState;
  public recipientChainChannel?: FullChannelState;
  public senderChain?: CHAIN_DETAIL;
  public senderAsset?: ASSET_DETAIL;
  public recipientChain?: CHAIN_DETAIL;
  public recipientAsset?: ASSET_DETAIL;
  public browserNode: BrowserNode | undefined;

  private evts?: EvtContainer;
  private swapDefinition?: any;

  private getFeesDebounced = AwesomeDebouncePromise(getCrosschainFee, 200);

  async init(params: InitParamsSchema): Promise<InitResponseSchema> {
    try {
      await this.setup({
        routerPublicIdentifier: params.routerPublicIdentifier,
        loginProvider: params.loginProvider,
        senderChainProvider: params.senderChainProvider,
        recipientChainProvider: params.recipientChainProvider,
        senderChainId: params.senderChainId,
        recipientChainId: params.recipientChainId,
        iframeSrcOverride: params.iframeSrcOverride,
      });
    } catch (e) {
      const message = "Failed at Setup";
      console.log(e, message);
      throw e;
    }

    try {
      const response = await this.checkPendingTransfer();
      console.log("SUCCESS INIT");
      return response;
    } catch (e) {
      const message = "Failed at Pending Tranfer Check";
      console.log(e, message);
      throw e;
    }
  }

  async setup(params: SetupParamsSchema) {
    this.routerPublicIdentifier = params.routerPublicIdentifier;

    let senderChainInfo: CHAIN_DETAIL;
    try {
      senderChainInfo = await getChain(params.senderChainId, params.senderChainProvider);
      this.senderChain = senderChainInfo;
    } catch (e) {
      const message = "Failed to fetch sender chain info";
      console.log(e, message);
      throw e;
    }

    let recipientChainInfo: CHAIN_DETAIL;
    try {
      recipientChainInfo = await getChain(params.recipientChainId, params.recipientChainProvider);
      this.recipientChain = recipientChainInfo;
    } catch (e) {
      const message = "Failed to fetch receiver chain info";
      console.log(e, message);
      throw e;
    }

    // setup browser node
    let _node: BrowserNode;
    try {
      // call isAlive if node set already (i.e. retry)
      if (this.browserNode && this.senderChainChannelAddress && this.recipientChainChannelAddress) {
        console.log("node found, sending isAlive message");
        const [depositRes, withdrawRes] = await Promise.all([
          this.browserNode.sendIsAliveMessage({
            channelAddress: this.senderChainChannelAddress,
            skipCheckIn: false,
          }),
          this.browserNode.sendIsAliveMessage({
            channelAddress: this.recipientChainChannelAddress,
            skipCheckIn: false,
          }),
        ]);
        console.log("messages sent", depositRes.isError, withdrawRes.isError);
      }
      // browser node object
      _node =
        this.browserNode ??
        (await connectNode(
          params.routerPublicIdentifier,
          senderChainInfo.chainId,
          recipientChainInfo.chainId,
          senderChainInfo.chainProvider,
          recipientChainInfo.chainProvider,
          params.loginProvider,
          params.iframeSrcOverride,
        ));
      this.browserNode = _node;
    } catch (e) {
      const message = "Error initalizing Browser Node";
      console.log(e, message);
      throw e;
    }

    console.log("INITIALIZED BROWSER NODE");

    const _evts = this.evts ?? createEvtContainer(_node);
    this.evts = _evts;

    let senderChainChannel: FullChannelState;
    try {
      senderChainChannel = await getChannelForChain(_node, params.routerPublicIdentifier, senderChainInfo.chainId);
      console.log("SETTING DepositChannel: ", senderChainChannel);
    } catch (e) {
      const message = "Could not get sender channel";
      console.log(e, message);
      throw e;
    }
    const senderChainChannelAddress = senderChainChannel!.channelAddress;
    this.senderChainChannelAddress = senderChainChannelAddress;

    let recipientChainChannel: FullChannelState;
    try {
      recipientChainChannel = await getChannelForChain(
        _node,
        params.routerPublicIdentifier,
        recipientChainInfo.chainId,
      );
      console.log("SETTING _withdrawChannel: ", recipientChainChannel);
    } catch (e) {
      const message = "Could not get sender channel";
      console.log(e, message);
      throw e;
    }

    const recipientChainChannelAddress = recipientChainChannel?.channelAddress!;
    this.recipientChainChannel = recipientChainChannel;
    this.recipientChainChannelAddress = recipientChainChannelAddress;
  }

  async checkPendingTransfer(): Promise<CheckPendingTransferResponseSchema> {
    try {
      await reconcileDeposit(this.browserNode!, this.senderChainChannelAddress, this.senderChain?.assetId!);
    } catch (e) {
      if (e.message.includes("must restore") || (e.context?.message ?? "").includes("must restore")) {
        console.warn(
          "Channel is out of sync, restoring before other operations. The channel was likely used in another browser.",
        );
        const restoreDepositChannelState = await this.browserNode!.restoreState({
          counterpartyIdentifier: this.routerPublicIdentifier,
          chainId: this.senderChain?.chainId!,
        });
        if (restoreDepositChannelState.isError) {
          const message = "Could not restore sender channel state";
          console.error(message, restoreDepositChannelState.getError());
          throw restoreDepositChannelState.getError();
        }
        const restoreWithdrawChannelState = await this.browserNode!.restoreState({
          counterpartyIdentifier: this.routerPublicIdentifier,
          chainId: this.recipientChain?.chainId!,
        });
        if (restoreWithdrawChannelState.isError) {
          const message = "Could not restore receiver channel state";
          console.error(message, restoreWithdrawChannelState.getError());
          throw restoreWithdrawChannelState.getError();
        }
        try {
          await reconcileDeposit(this.browserNode!, this.senderChainChannelAddress, this.senderChain?.assetId!);
        } catch (e) {
          const message = "Error in reconcileDeposit";
          console.error(message, e);
          throw e;
        }
      } else {
        const message = "Error in reconcileDeposit";
        console.error(message, e);
        throw e;
      }
    }

    // prune any existing receiver transfers
    try {
      const hangingResolutions = await cancelHangingToTransfers(
        this.browserNode!,
        this.evts![EngineEvents.CONDITIONAL_TRANSFER_CREATED],
        this.senderChain?.chainId!,
        this.recipientChain?.chainId!,
        this.recipientChain?.assetId!,
        this.routerPublicIdentifier,
      );
      console.log("Found hangingResolutions: ", hangingResolutions);
    } catch (e) {
      const message = "Error in cancelHangingToTransfers";
      console.log(e, message);
      throw e;
    }

    // get active transfers
    const [depositActive, withdrawActive] = await Promise.all([
      this.browserNode!.getActiveTransfers({
        channelAddress: this.senderChainChannelAddress,
      }),
      this.browserNode!.getActiveTransfers({
        channelAddress: this.recipientChainChannelAddress,
      }),
    ]);
    const depositHashlock = depositActive.getValue().filter((t) => Object.keys(t.transferState).includes("lockHash"));
    const withdrawHashlock = withdrawActive.getValue().filter((t) => Object.keys(t.transferState).includes("lockHash"));
    console.warn(
      "deposit active on init",
      depositHashlock.length,
      "ids:",
      depositHashlock.map((t) => t.transferId),
    );
    console.warn(
      "withdraw active on init",
      withdrawHashlock.length,
      "ids:",
      withdrawHashlock.map((t) => t.transferId),
    );

    // set a listener to check for transfers that may have been pushed after a refresh after the hanging transfers have already been canceled
    this.evts!.CONDITIONAL_TRANSFER_CREATED.pipe((data) => {
      return (
        data.transfer.responderIdentifier === this.browserNode!.publicIdentifier &&
        data.transfer.meta.routingId !== this.crossChainTransferId
      );
    }).attach(async (data) => {
      console.warn("Cancelling transfer thats not active");
      const senderResolution = this.evts!.CONDITIONAL_TRANSFER_RESOLVED.pipe(
        (data) =>
          data.transfer.meta.crossChainTransferId === this.crossChainTransferId &&
          data.channelAddress === this.senderChainChannelAddress,
      ).waitFor(45_000);

      const receiverResolution = this.evts!.CONDITIONAL_TRANSFER_RESOLVED.pipe(
        (data) =>
          data.transfer.meta.crossChainTransferId === this.crossChainTransferId &&
          data.channelAddress === this.recipientChainChannelAddress,
      ).waitFor(45_000);
      try {
        await cancelToAssetTransfer(this.browserNode!, this.recipientChainChannelAddress, data.transfer.transferId);
      } catch (e) {
        const message = "Error in cancelToAssetTransfer";
        console.log(e, message);
        throw e;
      }

      try {
        await Promise.all([senderResolution, receiverResolution]);
        const message = "Transfer was cancelled";
        console.log(message);
        throw new Error(message);
      } catch (e) {
        const message = "Error waiting for sender and receiver cancellations";
        console.log(e, message);
        throw e;
      }
    });

    try {
      console.log("Waiting for sender cancellations..");
      await waitForSenderCancels(
        this.browserNode!,
        this.evts![EngineEvents.CONDITIONAL_TRANSFER_RESOLVED],
        this.senderChainChannelAddress,
      );
      console.log("done!");
    } catch (e) {
      const message = "Error in waitForSenderCancels";
      console.log(e, message);
      throw e;
    }

    // After reconciling, get channel again
    try {
      this.senderChainChannel = await getChannelForChain(
        this.browserNode!,
        this.routerPublicIdentifier,
        this.senderChain?.chainId!,
      );
    } catch (e) {
      const message = "Could not get sender channel";
      console.log(e, message);
      throw e;
    }

    const offChainSenderChainAssetBalance = BigNumber.from(
      getBalanceForAssetId(this.senderChainChannel, this.senderChain?.assetId!, "bob"),
    );
    console.log(
      `Offchain balance for ${this.senderChainChannelAddress} of asset ${this.senderChain
        ?.assetId!}: ${offChainSenderChainAssetBalance}`,
    );

    const offChainRecipientChainAssetBalance = BigNumber.from(
      getBalanceForAssetId(this.recipientChainChannel!, this.recipientChain?.assetId!, "bob"),
    );
    console.log(
      `Offchain balance for ${this.recipientChainChannelAddress} of asset ${this.recipientChain
        ?.assetId!}: ${offChainRecipientChainAssetBalance}`,
    );

    return {
      offChainSenderChainAssetBalanceBn: offChainSenderChainAssetBalance,
      offChainRecipientChainAssetBalanceBn: offChainRecipientChainAssetBalance,
    };
  }

  async estimateFees(params: EstimateFeeParamsSchema): Promise<EstimateFeeResponseSchema> {
    const {
      input: _input,
      senderAssetId: _senderAssetId,
      recipientAssetId: _recipientAssetId,
      isRecipientAssetInput,
      userBalanceWei,
    } = params;

    const senderAssetId = utils.getAddress(_senderAssetId);
    const recipientAssetId = utils.getAddress(_recipientAssetId);

    if (!this.senderAsset && this.senderAsset!.assetId !== senderAssetId) {
      // get decimals for deposit asset
      const assetDecimals = await getAssetDecimals(senderAssetId, this.senderChain?.rpcProvider!);
      const chain: ChainInfo = await getChainInfo(this.senderChain?.chainId!);

      const _senderAsset = {
        name: chain.assetId[senderAssetId]?.symbol ?? "Token",
        assetId: senderAssetId,
        decimals: assetDecimals,
      };

      this.senderAsset = _senderAsset;
    }

    if (!this.recipientAsset && this.recipientAsset!.assetId !== recipientAssetId) {
      // get decimals for deposit asset
      const assetDecimals = await getAssetDecimals(recipientAssetId, this.recipientChain?.rpcProvider!);
      const chain: ChainInfo = await getChainInfo(this.recipientChain?.chainId!);

      const _recipientAsset = {
        name: chain.assetId[recipientAssetId]?.symbol ?? "Token",
        assetId: recipientAssetId,
        decimals: assetDecimals,
      };

      this.recipientAsset = _recipientAsset;
    }

    // Verify router supports...
    if (!this.swapDefinition) {
      try {
        const swap = await verifyAndGetRouterSupports(
          this.browserNode!,
          this.senderChain?.chainId!,
          this.senderAsset?.assetId!,
          this.recipientChain?.chainId!,
          this.recipientAsset?.assetId!,
          this.recipientChain?.rpcProvider!,
          this.routerPublicIdentifier,
        );
        this.swapDefinition = swap;
      } catch (e) {
        const message = "Error in verifyRouterSupports";
        console.log(e, message);
        throw e;
      }
    }

    const input = _input ? _input.trim() : undefined;
    let err: string | undefined = undefined;

    if (!input) {
      return {
        error: err,
        senderAmount: "",
        recipientAmount: "",
        totalFee: undefined,
        transferQuote: undefined,
        withdrawalQuote: undefined,
      };
    }

    let senderAmountUi: string | undefined = isRecipientAssetInput ? "" : input;
    let recipientAmountUi: string | undefined = isRecipientAssetInput ? input : "";
    let totalFee: string | undefined = undefined;
    let transferQuote: TransferQuote | undefined = undefined;
    let withdrawalQuote: WithdrawalQuote | undefined = undefined;

    try {
      const transferAmountBn = BigNumber.from(
        utils.parseUnits(input, isRecipientAssetInput ? this.recipientAsset?.decimals! : this.senderAsset?.decimals!),
      );

      if (transferAmountBn.isZero()) {
        err = "Transfer amount cannot be 0";
        return {
          error: err,
          senderAmount: senderAmountUi,
          recipientAmount: recipientAmountUi,
          totalFee: totalFee,
          transferQuote: transferQuote,
          withdrawalQuote: withdrawalQuote,
        };
      }

      let feeBn: BigNumber;
      let senderAmountBn: BigNumber;
      let recipientAmountBn: BigNumber;
      try {
        const {
          totalFee,
          senderAmount: _senderAmount,
          recipientAmount: _recipientAmount,
          transferQuote: _transferQuote,
          withdrawalQuote: _withdrawalQuote,
        } = await this.getFeesDebounced(
          this.browserNode!,
          this.routerPublicIdentifier,
          transferAmountBn,
          this.senderChain?.chainId!,
          this.senderAsset?.assetId!,
          this.senderAsset?.decimals!,
          this.recipientChain?.chainId!,
          this.recipientAsset?.assetId!,
          this.recipientAsset?.decimals!,
          this.recipientChainChannelAddress,
          this.swapDefinition!,
          isRecipientAssetInput,
        );
        feeBn = totalFee;
        senderAmountBn = BigNumber.from(_senderAmount);
        recipientAmountBn = BigNumber.from(_recipientAmount);
        transferQuote = _transferQuote;
        withdrawalQuote = _withdrawalQuote;
      } catch (e) {
        return {
          error: e.message,
          senderAmount: senderAmountUi,
          recipientAmount: recipientAmountUi,
          totalFee: totalFee,
          transferQuote: transferQuote,
          withdrawalQuote: withdrawalQuote,
        };
      }

      totalFee = utils.formatUnits(feeBn, this.senderAsset?.decimals!);
      console.log("feeUi: ", totalFee);

      if (BigNumber.from(recipientAmountBn).lte(0)) {
        const err = "Not enough amount to pay fees";
        return {
          error: err,
          senderAmount: senderAmountUi,
          recipientAmount: recipientAmountUi,
          totalFee: totalFee,
          transferQuote: transferQuote,
          withdrawalQuote: withdrawalQuote,
        };
      }

      if (isRecipientAssetInput) {
        senderAmountUi = utils.formatUnits(senderAmountBn, this.senderAsset?.decimals!);
        console.log("senderUi: ", senderAmountUi);
      } else {
        recipientAmountUi = utils.formatUnits(recipientAmountBn, this.recipientAsset?.decimals!);
        console.log("receivedUi: ", recipientAmountUi);
      }

      if (userBalanceWei) {
        const userBalanceBn = BigNumber.from(utils.parseUnits(userBalanceWei, this.senderAsset?.decimals!));
        if (senderAmountBn.gt(userBalanceBn)) {
          err = "Transfer amount exceeds user balance";
          return {
            error: err,
            senderAmount: senderAmountUi,
            recipientAmount: recipientAmountUi,
            totalFee: totalFee,
            transferQuote: transferQuote,
            withdrawalQuote: withdrawalQuote,
          };
        }
      }
    } catch (e) {
      err = "Invalid amount";
    }

    return {
      error: err,
      senderAmount: senderAmountUi,
      recipientAmount: recipientAmountUi,
      totalFee: totalFee,
      transferQuote: transferQuote,
      withdrawalQuote: withdrawalQuote,
    };
  }

  async preTransferCheck(params: preTransferCheckParamsSchema) {
    const { input, senderAssetId: _senderAssetId, recipientAssetId: _recipientAssetId } = params;

    const senderAssetId = utils.getAddress(_senderAssetId);
    const recipientAssetId = utils.getAddress(_recipientAssetId);
    const senderAssetDecimals = await getAssetDecimals(senderAssetId, this.senderChain?.rpcProvider!);
    const recipientAssetDecimals = await getAssetDecimals(recipientAssetId, this.recipientChain?.rpcProvider!);

    if (!input) {
      const message = "Transfer Amount is undefined";
      console.log(message);
      throw new Error(message);
    }
    const transferAmountBn: BigNumber = BigNumber.from(utils.parseUnits(input, senderAssetDecimals));

    if (transferAmountBn.isZero()) {
      const message = "Transfer amount cannot be 0";
      console.log(message);
      throw new Error(message);
    }

    // Verify router supports...
    if (!this.swapDefinition) {
      try {
        const swap = await verifyAndGetRouterSupports(
          this.browserNode!,
          this.senderChain?.chainId!,
          senderAssetId,
          this.recipientChain?.chainId!,
          recipientAssetId,
          this.recipientChain?.rpcProvider!,
          this.routerPublicIdentifier,
        );
        this.swapDefinition = swap;
      } catch (e) {
        const message = "Error in verifyRouterSupports";
        console.log(e, message);
        throw e;
      }
    }

    console.log("Verify Router Capacity");
    try {
      await verifyRouterCapacityForTransfer(
        this.recipientChain?.rpcProvider!,
        recipientAssetId,
        recipientAssetDecimals,
        this.recipientChainChannel!,
        transferAmountBn,
        this.swapDefinition!,
        senderAssetDecimals,
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async deposit(params: DepositParamsSchema) {
    const {
      transferAmount,
      senderAssetId: _senderAssetId,
      recipientAssetId: _recipientAssetId,
      preTransferCheck = true,
      webProvider,
      onDeposited,
    } = params;

    const senderAssetId = utils.getAddress(_senderAssetId);
    const recipientAssetId = utils.getAddress(_recipientAssetId);
    const senderAssetDecimals = await getAssetDecimals(senderAssetId, this.senderChain?.rpcProvider!);

    if (preTransferCheck) {
      try {
        await this.preTransferCheck({ input: transferAmount, senderAssetId, recipientAssetId });
      } catch (e) {
        console.log("Error at preCheck", e);
        throw e;
      }
    }

    const transferAmountBn = BigNumber.from(utils.parseUnits(transferAmount, senderAssetDecimals));
    console.log(transferAmountBn);

    try {
      const signer = webProvider.getSigner();

      const depositTx =
        senderAssetId === constants.AddressZero
          ? await signer.sendTransaction({
              to: this.senderChainChannelAddress!,
              value: transferAmountBn,
            })
          : await new Contract(senderAssetId, ERC20Abi, signer).transfer(
              this.senderChainChannelAddress!,
              transferAmountBn,
            );

      const receipt = await depositTx.wait(1);
      console.log("deposit mined:", receipt.transactionHash);

      this.senderChain?.rpcProvider!.waitForTransaction(depositTx.hash).then((receipt) => {
        if (receipt.status === 0) {
          // tx reverted
          const message = "Transaction reverted onchain";
          console.error(message, receipt);
          throw new Error(message);
        }
      });
      if (onDeposited) {
        onDeposited(depositTx.hash);
      }
    } catch (e) {
      console.log("Error at deposit", e);
      throw e;
    }
  }

  async transfer(params: TransferParamsSchema) {
    const { transferQuote, senderAssetId: _senderAssetId, recipientAssetId: _recipientAssetId } = params;

    const senderAssetId = utils.getAddress(_senderAssetId);
    const recipientAssetId = utils.getAddress(_recipientAssetId);
    const crossChainTransferId = getRandomBytes32();
    const preImage = getRandomBytes32();

    this.crossChainTransferId = crossChainTransferId;

    console.log(`Calling reconcileDeposit with ${this.senderChainChannelAddress!} and ${senderAssetId}`);
    await reconcileDeposit(this.browserNode!, this.senderChainChannelAddress!, senderAssetId);

    try {
      console.log(
        `Calling createFromAssetTransfer ${this.senderChain?.chainId!} ${senderAssetId} ${
          this.recipientChain?.chainId
        } ${recipientAssetId} ${crossChainTransferId}`,
      );
      const transferDeets = await createFromAssetTransfer(
        this.browserNode!,
        this.senderChain?.chainId!,
        senderAssetId,
        this.recipientChain?.chainId!,
        recipientAssetId,
        this.routerPublicIdentifier,
        crossChainTransferId,
        preImage,
        transferQuote,
      );
      console.log("createFromAssetTransfer transferDeets: ", transferDeets);
    } catch (e) {
      if (e.message.includes("Fees charged are greater than amount")) {
        const message = "Last requested transfer is lower than fees charged";
        console.error(message, e);
        throw new Error(message);
      }
      console.log(e);
      throw e;
    }

    // listen for a sender-side cancellation, if it happens, short-circuit and show cancellation
    const senderCancel = this.evts![EngineEvents.CONDITIONAL_TRANSFER_RESOLVED].pipe((data) => {
      return (
        data.transfer.meta?.routingId === crossChainTransferId &&
        data.transfer.responderIdentifier === this.routerPublicIdentifier &&
        Object.values(data.transfer.transferResolver)[0] === constants.HashZero
      );
    }).waitFor(500_000);

    const receiverCreate = this.evts![EngineEvents.CONDITIONAL_TRANSFER_CREATED].pipe((data) => {
      return (
        data.transfer.meta?.routingId === crossChainTransferId &&
        data.transfer.initiatorIdentifier === this.routerPublicIdentifier
      );
    }).waitFor(500_000);

    // wait a long time for this, it needs to send onchain txs
    // if the receiver create doesnt complete, sender side can get cancelled
    try {
      const senderCanceledOrReceiverCreated = await Promise.race([senderCancel, receiverCreate]);
      console.log("Received senderCanceledOrReceiverCreated: ", senderCanceledOrReceiverCreated);
      if (Object.values(senderCanceledOrReceiverCreated.transfer.transferResolver ?? {})[0] === constants.HashZero) {
        const message = "Transfer was cancelled";
        console.log(message);
        throw new Error(message);
      }
    } catch (e) {
      const message = "Did not receive transfer after 500 seconds, please try again later or attempt recovery";
      console.log(e, message);
      throw e;
    }

    const senderResolve = this.evts![EngineEvents.CONDITIONAL_TRANSFER_RESOLVED].pipe((data) => {
      return (
        data.transfer.meta?.routingId === crossChainTransferId &&
        data.transfer.responderIdentifier === this.routerPublicIdentifier
      );
    }).waitFor(45_000);

    try {
      await resolveToAssetTransfer(
        this.browserNode!,
        this.recipientChain?.chainId!,
        preImage,
        crossChainTransferId,
        this.routerPublicIdentifier,
      );
    } catch (e) {
      const message = "Error in resolveToAssetTransfer";
      console.log(message);
      throw new Error(message);
    }

    try {
      await senderResolve;
    } catch (e) {
      console.warn("Did not find resolve event from router, proceeding with withdrawal", e);
    }
  }

  async withdraw(params: WithdrawParamsSchema) {
    const {
      recipientAddress,
      recipientAssetId: _recipientAssetId,
      onFinished,
      withdrawalQuote,
      withdrawalCallTo,
      withdrawalCallData,
      generateCallData,
    } = params;

    const recipientAssetId = utils.getAddress(_recipientAssetId);
    const recipientAssetDecimals = await getAssetDecimals(recipientAssetId, this.recipientChain?.rpcProvider!);
    // now go to withdrawal screen
    let result;
    try {
      result = await withdrawToAsset(
        this.browserNode!,
        this.evts![EngineEvents.WITHDRAWAL_RESOLVED],
        this.recipientChain?.chainId!,
        recipientAssetId,
        recipientAddress,
        this.routerPublicIdentifier,
        withdrawalQuote,
        withdrawalCallTo,
        withdrawalCallData,
        generateCallData,
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
    // display tx hash through explorer -> handles by the event.
    console.log("crossChainTransfer: ", result);

    const successWithdrawalUi = utils.formatUnits(result.withdrawalAmount, recipientAssetDecimals);
    console.log(successWithdrawalUi);

    if (onFinished) {
      onFinished(result.withdrawalTx, successWithdrawalUi, BigNumber.from(result.withdrawalAmount));
    }

    // check tx receipt for withdrawal tx
    this.recipientChain?.rpcProvider.waitForTransaction(result.withdrawalTx).then((receipt) => {
      if (receipt.status === 0) {
        // tx reverted
        const message = "Transaction reverted onchain";
        console.error(message, receipt);
        throw new Error(message);
      }
    });
  }

  async crossChainSwap(params: CrossChainSwapParamsSchema) {
    const {
      recipientAddress,
      senderAssetId: _senderAssetId,
      recipientAssetId: _recipientAssetId,
      onFinished,
      transferQuote,
      withdrawalQuote,
      withdrawalCallTo,
      withdrawalCallData,
      generateCallData,
    } = params;

    const senderAssetId = utils.getAddress(_senderAssetId);
    const recipientAssetId = utils.getAddress(_recipientAssetId);

    try {
      await this.transfer({ transferQuote, senderAssetId, recipientAssetId });
    } catch (e) {
      console.log("Error at Transfer", e);
      throw e;
    }

    try {
      await this.withdraw({
        recipientAddress,
        recipientAssetId,
        onFinished,
        withdrawalQuote,
        withdrawalCallTo,
        withdrawalCallData,
        generateCallData,
      });
    } catch (e) {
      console.log("Error at withdraw", e);
      throw e;
    }

    console.log("Successfully Swap");
  }
}
