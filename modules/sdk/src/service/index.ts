import { EngineEvents, FullChannelState } from '@connext/vector-types';
import { BrowserNode } from '@connext/vector-browser-node';
import { getBalanceForAssetId, getRandomBytes32 } from '@connext/vector-utils';
import { BigNumber, constants, utils } from 'ethers';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import {
  CHAIN_DETAIL,
  InitParamsSchema,
  EstimateFeeParamsSchema,
  EstimateFeeResponseSchema,
  TransferParamsSchema,
  WithdrawParamsSchema,
} from '../constants';
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
} from '../utils';

export class ConnextSdk {
  public routerPublicIdentifier = '';
  public senderChainChannelAddress = '';
  public recipientChainChannelAddress = '';
  public senderChainChannel?: FullChannelState;
  public recipientChainChannel?: FullChannelState;
  public senderChain?: CHAIN_DETAIL;
  public recipientChain?: CHAIN_DETAIL;
  public connextClient: BrowserNode | undefined;

  private evts?: EvtContainer;
  private swapDefinition?: any;

  private getFeesDebounced = AwesomeDebouncePromise(getCrosschainFee, 200);

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
      throw new Error(`${message}: ${e}`);
    }
    const senderChainChannelAddress = senderChainChannel!.channelAddress;
    this.senderChainChannelAddress = senderChainChannelAddress;

    let recipientChainChannel: FullChannelState;
    try {
      recipientChainChannel = await getChannelForChain(
        _node,
        params.routerPublicIdentifier,
        recipientChainInfo.chainId
      );
      console.log('SETTING _withdrawChannel: ', recipientChainChannel);
    } catch (e) {
      const message = 'Could not get sender channel';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    const recipientChainChannelAddress = recipientChainChannel?.channelAddress!;
    this.recipientChainChannel = recipientChainChannel;
    this.recipientChainChannelAddress = recipientChainChannelAddress;

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
      this.swapDefinition = swap;
    } catch (e) {
      const message = 'Error in verifyRouterSupports';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    try {
      await reconcileDeposit(
        _node,
        senderChainChannelAddress,
        senderChainInfo.assetId
      );
    } catch (e) {
      if (
        e.message.includes('must restore') ||
        (e.context?.message ?? '').includes('must restore')
      ) {
        console.warn(
          'Channel is out of sync, restoring before other operations. The channel was likely used in another browser.'
        );
        const restoreDepositChannelState = await _node.restoreState({
          counterpartyIdentifier: params.routerPublicIdentifier,
          chainId: senderChainInfo.chainId,
        });
        if (restoreDepositChannelState.isError) {
          const message = 'Could not restore sender channel state';
          console.error(message, restoreDepositChannelState.getError());
          throw new Error(
            `${message}: ${restoreDepositChannelState.getError()}`
          );
        }
        const restoreWithdrawChannelState = await _node.restoreState({
          counterpartyIdentifier: params.routerPublicIdentifier,
          chainId: recipientChainInfo.chainId,
        });
        if (restoreWithdrawChannelState.isError) {
          const message = 'Could not restore receiver channel state';
          console.error(message, restoreWithdrawChannelState.getError());
          throw new Error(
            `${message}: ${restoreWithdrawChannelState.getError()}`
          );
        }
        try {
          await reconcileDeposit(
            _node,
            senderChainChannelAddress,
            senderChainInfo.assetId
          );
        } catch (e) {
          const message = 'Error in reconcileDeposit';
          console.error(message, e);
          throw new Error(`${message}: ${e}`);
        }
      } else {
        const message = 'Error in reconcileDeposit';
        console.error(message, e);
        throw new Error(`${message}: ${e}`);
      }
    }

    // Checking for pending Cross-Chain Transfers...

    // prune any existing receiver transfers
    try {
      const hangingResolutions = await cancelHangingToTransfers(
        _node,
        _evts[EngineEvents.CONDITIONAL_TRANSFER_CREATED],
        senderChainInfo.chainId,
        recipientChainInfo.chainId,
        recipientChainInfo.assetId,
        params.routerPublicIdentifier
      );
      console.log('Found hangingResolutions: ', hangingResolutions);
    } catch (e) {
      const message = 'Error in cancelHangingToTransfers';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    // get active transfers
    const [depositActive, withdrawActive] = await Promise.all([
      _node.getActiveTransfers({
        channelAddress: senderChainChannelAddress,
      }),
      _node.getActiveTransfers({
        channelAddress: recipientChainChannelAddress,
      }),
    ]);
    const depositHashlock = depositActive
      .getValue()
      .filter((t) => Object.keys(t.transferState).includes('lockHash'));
    const withdrawHashlock = withdrawActive
      .getValue()
      .filter((t) => Object.keys(t.transferState).includes('lockHash'));
    console.warn(
      'deposit active on init',
      depositHashlock.length,
      'ids:',
      depositHashlock.map((t) => t.transferId)
    );
    console.warn(
      'withdraw active on init',
      withdrawHashlock.length,
      'ids:',
      withdrawHashlock.map((t) => t.transferId)
    );

    // set a listener to check for transfers that may have been pushed after a refresh after the hanging transfers have already been canceled
    // _evts.CONDITIONAL_TRANSFER_CREATED.pipe((data) => {
    //   return (
    //     data.transfer.responderIdentifier === _node.publicIdentifier &&
    //     data.transfer.meta.routingId !== activeCrossChainTransferIdRef.current
    //   );
    // }).attach(async (data) => {
    //   console.warn('Cancelling transfer thats not active');
    //   await cancelTransfer(
    //     senderChainChannelAddress,
    //     recipientChainChannelAddress,
    //     data.transfer.transferId,
    //     data.transfer.meta.crossChainTransferId,
    //     _evts!,
    //     _node
    //   );
    // });

    try {
      console.log('Waiting for sender cancellations..');
      await waitForSenderCancels(
        _node,
        _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED],
        senderChainChannelAddress
      );
      console.log('done!');
    } catch (e) {
      const message = 'Error in waitForSenderCancels';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    // After reconciling, get channel again
    try {
      senderChainChannel = await getChannelForChain(
        _node,
        params.routerPublicIdentifier,
        senderChainInfo.chainId
      );
    } catch (e) {
      const message = 'Could not get sender channel';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    const offChainSenderChainAssetBalance = BigNumber.from(
      getBalanceForAssetId(senderChainChannel, senderChainInfo.assetId, 'bob')
    );
    console.log(
      `Offchain balance for ${senderChainChannelAddress} of asset ${senderChainInfo.assetId}: ${offChainSenderChainAssetBalance}`
    );

    const offChainRecipientChainAssetBalance = BigNumber.from(
      getBalanceForAssetId(
        recipientChainChannel,
        recipientChainInfo.assetId,
        'bob'
      )
    );
    console.log(
      `Offchain balance for ${recipientChainChannelAddress} of asset ${recipientChainInfo.assetId}: ${offChainRecipientChainAssetBalance}`
    );

    if (
      offChainSenderChainAssetBalance.gt(0) &&
      offChainRecipientChainAssetBalance.gt(0)
    ) {
      console.warn(
        'Balance exists in both channels, transferring first, then withdrawing'
      );
    }
    // if offChainDepositAssetBalance > 0
    if (offChainSenderChainAssetBalance.gt(0)) {
      // TODO: Existing Balance Detected
    }

    // if offchainWithdrawBalance > 0
    else if (offChainRecipientChainAssetBalance.gt(0)) {
      // then go to withdraw screen with transfer amount == balance
      // TODO: Existing Balance Detected at recipient chain
    }

    console.log('SUCCESS INIT');
  }

  async estimateFees(
    params: EstimateFeeParamsSchema
  ): Promise<EstimateFeeResponseSchema | undefined> {
    const { input: _input, isRecipientAssetInput, userBalance } = params;

    const input = _input ? _input.trim() : undefined;

    if (!input) {
      return;
    }

    let err: string | undefined = undefined;
    let senderAmountUi: string | undefined = isRecipientAssetInput
      ? undefined
      : input;
    let recipientAmountUi: string | undefined = isRecipientAssetInput
      ? input
      : undefined;
    let totalFee: string | undefined = undefined;

    try {
      const transferAmountBn = BigNumber.from(
        utils.parseUnits(
          input,
          isRecipientAssetInput
            ? this.recipientChain?.assetDecimals!
            : this.senderChain?.assetDecimals!
        )
      );

      if (transferAmountBn.isZero()) {
        err = 'Transfer amount cannot be 0';
        return {
          error: err,
          senderAmount: senderAmountUi,
          recipientAmount: recipientAmountUi,
          estimatedFee: totalFee,
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
        } = await this.getFeesDebounced(
          this.connextClient!,
          this.routerPublicIdentifier,
          transferAmountBn,
          this.senderChain?.chainId!,
          this.senderChain?.assetId!,
          this.senderChain?.assetDecimals!,
          this.recipientChain?.chainId!,
          this.recipientChain?.assetId!,
          this.recipientChain?.assetDecimals!,
          this.recipientChainChannelAddress,
          this.swapDefinition!,
          isRecipientAssetInput
        );
        feeBn = totalFee;
        senderAmountBn = BigNumber.from(_senderAmount);
        recipientAmountBn = BigNumber.from(_recipientAmount);
      } catch (e) {
        return {
          error: e.message,
          senderAmount: senderAmountUi,
          recipientAmount: recipientAmountUi,
          estimatedFee: totalFee,
        };
      }

      totalFee = utils.formatUnits(feeBn, this.senderChain?.assetDecimals!);
      console.log('feeUi: ', totalFee);

      if (BigNumber.from(recipientAmountBn).lte(0)) {
        const err = 'Not enough amount to pay fees';
        return {
          error: err,
          senderAmount: senderAmountUi,
          recipientAmount: recipientAmountUi,
          estimatedFee: totalFee,
        };
      }

      if (isRecipientAssetInput) {
        senderAmountUi = utils.formatUnits(
          senderAmountBn,
          this.senderChain?.assetDecimals!
        );
        console.log('senderUi: ', senderAmountUi);
      } else {
        recipientAmountUi = utils.formatUnits(
          recipientAmountBn,
          this.recipientChain?.assetDecimals!
        );
        console.log('receivedUi: ', recipientAmountUi);
      }

      if (userBalance) {
        const userBalanceBn = BigNumber.from(
          utils.parseUnits(userBalance, this.senderChain?.assetDecimals!)
        );
        if (senderAmountBn.gt(userBalanceBn)) {
          err = 'Transfer amount exceeds user balance';
          return {
            error: err,
            senderAmount: senderAmountUi,
            recipientAmount: recipientAmountUi,
            estimatedFee: totalFee,
          };
        }
      }
    } catch (e) {
      err = 'Invalid amount';
    }

    return {
      error: err,
      senderAmount: senderAmountUi,
      recipientAmount: recipientAmountUi,
      estimatedFee: totalFee,
    };
  }

  async preCheckTransfer(senderAmount: string) {
    if (senderAmount) {
      const message = 'Transfer Amount is undefined';
      console.log(message);
      throw new Error(`${message}`);
    }
    const transferAmountBn: BigNumber = BigNumber.from(
      utils.parseUnits(senderAmount, this.senderChain?.assetDecimals!)
    );

    if (transferAmountBn.isZero()) {
      const message = 'Transfer amount cannot be 0';
      console.log(message);
      throw new Error(`${message}`);
    }

    console.log('Verify Router Capacity');
    try {
      console.log(
        `Calling reconcileDeposit with ${this
          .senderChainChannelAddress!} and ${this.senderChain?.assetId!}`
      );
      await reconcileDeposit(
        this.connextClient!,
        this.senderChainChannelAddress!,
        this.senderChain?.assetId!
      );
      await verifyRouterCapacityForTransfer(
        this.recipientChain?.rpcProvider!,
        this.recipientChain?.assetId!,
        this.recipientChain?.assetDecimals!,
        this.recipientChainChannel!,
        transferAmountBn,
        this.swapDefinition!,
        this.senderChain?.assetDecimals!
      );
      console.log(
        `Transferring ${transferAmountBn.toString()} through injected provider`
      );
    } catch (e) {
      console.log(e);
      throw Error(e);
    }
  }

  async transfer(params: TransferParamsSchema) {
    const { senderAmount, transactionHash, preCheck = true } = params;
    const crossChainTransferId = getRandomBytes32();
    const preImage = getRandomBytes32();

    if (preCheck) {
      try {
        await this.preCheckTransfer(senderAmount);
      } catch (e) {
        console.log(e);
        throw Error(e);
      }
    }

    try {
      await this.senderChain
        ?.rpcProvider!.waitForTransaction(transactionHash, 2)
        .then((receipt) => {
          if (receipt.status === 0) {
            // tx reverted
            const message = 'Transaction reverted onchain';
            console.error(message, receipt);
            throw new Error(message);
          }
        });
    } catch (e) {
      console.log(e);
      throw Error(e);
    }

    try {
      console.log(
        `Calling createFromAssetTransfer ${this.senderChain?.chainId!} ${this
          .senderChain?.assetId!} ${this.recipientChain?.chainId} ${
          this.recipientChain?.assetId
        } ${crossChainTransferId}`
      );
      const transferDeets = await createFromAssetTransfer(
        this.connextClient!,
        this.senderChain?.chainId!,
        this.senderChain?.assetId!,
        this.recipientChain?.chainId!,
        this.recipientChain?.assetId!,
        this.routerPublicIdentifier,
        crossChainTransferId,
        preImage
      );
      console.log('createFromAssetTransfer transferDeets: ', transferDeets);
    } catch (e) {
      if (e.message.includes('Fees charged are greater than amount')) {
        const message = 'Last requested transfer is lower than fees charged';
        console.error(message, e);
        throw new Error(message);
      }
      console.log(e);
      throw Error(e);
    }

    // listen for a sender-side cancellation, if it happens, short-circuit and show cancellation
    const senderCancel = this.evts![
      EngineEvents.CONDITIONAL_TRANSFER_RESOLVED
    ].pipe((data) => {
      return (
        data.transfer.meta?.routingId === crossChainTransferId &&
        data.transfer.responderIdentifier === this.routerPublicIdentifier &&
        Object.values(data.transfer.transferResolver)[0] === constants.HashZero
      );
    }).waitFor(500_000);

    const receiverCreate = this.evts![
      EngineEvents.CONDITIONAL_TRANSFER_CREATED
    ].pipe((data) => {
      return (
        data.transfer.meta?.routingId === crossChainTransferId &&
        data.transfer.initiatorIdentifier === this.routerPublicIdentifier
      );
    }).waitFor(500_000);

    // wait a long time for this, it needs to send onchain txs
    // if the receiver create doesnt complete, sender side can get cancelled
    try {
      const senderCanceledOrReceiverCreated = await Promise.race([
        senderCancel,
        receiverCreate,
      ]);
      console.log(
        'Received senderCanceledOrReceiverCreated: ',
        senderCanceledOrReceiverCreated
      );
      if (
        Object.values(
          senderCanceledOrReceiverCreated.transfer.transferResolver ?? {}
        )[0] === constants.HashZero
      ) {
        const message = 'Transfer was cancelled';
        console.log(message);
        throw new Error(`${message}`);
      }
    } catch (e) {
      const message =
        'Did not receive transfer after 500 seconds, please try again later or attempt recovery';
      console.log(e, message);
      throw new Error(`${message}: ${e}`);
    }

    const senderResolve = this.evts![
      EngineEvents.CONDITIONAL_TRANSFER_RESOLVED
    ].pipe((data) => {
      return (
        data.transfer.meta?.routingId === crossChainTransferId &&
        data.transfer.responderIdentifier === this.routerPublicIdentifier
      );
    }).waitFor(45_000);

    try {
      await resolveToAssetTransfer(
        this.connextClient!,
        this.recipientChain?.chainId!,
        preImage,
        crossChainTransferId,
        this.routerPublicIdentifier
      );
    } catch (e) {
      const message = 'Error in resolveToAssetTransfer';
      console.log(message);
      throw new Error(`${message}`);
    }

    try {
      await senderResolve;
    } catch (e) {
      console.warn(
        'Did not find resolve event from router, proceeding with withdrawal',
        e
      );
    }

    const withdrawalParams: WithdrawParamsSchema = {
      recipientAddress: params.recipientAddress,
      withdrawCallTo: params.withdrawCallTo,
      withdrawCallData: params.withdrawCallData,
    };
    await this.withdraw(withdrawalParams);
  }

  async withdraw(params: WithdrawParamsSchema) {
    const { recipientAddress, withdrawCallTo, withdrawCallData } = params;
    // now go to withdrawal screen
    let result;
    try {
      result = await withdrawToAsset(
        this.connextClient!,
        this.evts![EngineEvents.WITHDRAWAL_RESOLVED],
        this.recipientChain?.chainId!,
        this.recipientChain?.assetId!,
        recipientAddress,
        this.routerPublicIdentifier,
        withdrawCallTo,
        withdrawCallData
      );
    } catch (e) {
      console.log(e);
      throw Error(e);
    }
    // display tx hash through explorer -> handles by the event.
    console.log('crossChainTransfer: ', result);

    const successWithdrawalUi = utils.formatUnits(
      result.withdrawalAmount,
      this.recipientChain?.assetDecimals!
    );

    console.log(successWithdrawalUi);

    // check tx receipt for withdrawal tx
    this.recipientChain?.rpcProvider
      .waitForTransaction(result.withdrawalTx)
      .then((receipt) => {
        if (receipt.status === 0) {
          // tx reverted
          const message = 'Transaction reverted onchain';
          console.error(message, receipt);
          throw new Error(message);
        }
      });
  }
}
