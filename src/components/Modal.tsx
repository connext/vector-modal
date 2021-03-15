import { BrowserNode } from '@connext/vector-browser-node';
import React, { FC, useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { Modal } from '@chakra-ui/react';
import {
  EngineEvents,
  ERC20Abi,
  FullChannelState,
  TransferQuote,
  WithdrawalQuote,
} from '@connext/vector-types';
import { getBalanceForAssetId, getRandomBytes32 } from '@connext/vector-utils';
import { BigNumber, constants, utils, providers, Contract } from 'ethers';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

import {
  ERROR_STATES,
  SCREEN_STATES,
  CHAIN_DETAIL,
  ScreenStates,
  ErrorStates,
} from '../constants';
import {
  getTotalDepositsBob,
  reconcileDeposit,
  createEvtContainer,
  EvtContainer,
  verifyAndGetRouterSupports,
  cancelHangingToTransfers,
  getChannelForChain,
  createFromAssetTransfer,
  withdrawToAsset,
  resolveToAssetTransfer,
  waitForSenderCancels,
  cancelToAssetTransfer,
  getChain,
  connectNode,
  verifyRouterCapacityForTransfer,
  getUserBalance,
  getCrosschainFee,
  truncate,
} from '../utils';
import {
  theme,
  Fonts,
  ModalOverlay,
  ModalContentContainer,
  BackButton,
  CloseButton,
} from './common';
import {
  Loading,
  Swap,
  SwapListener,
  Status,
  ErrorScreen,
  Success,
  Recover,
} from './pages';
import { Options } from './static';

export type ConnextModalProps = {
  showModal: boolean;
  routerPublicIdentifier: string;
  depositChainId?: number;
  depositChainProvider: string;
  depositAssetId: string;
  withdrawChainProvider: string;
  withdrawChainId?: number;
  withdrawAssetId: string;
  withdrawalAddress: string;
  transferAmount?: string;
  injectedProvider?: any;
  loginProvider: any;
  iframeSrcOverride?: string;
  withdrawCallTo?: string;
  withdrawCallData?: string;
  onClose: () => void;
  onReady?: (params: {
    depositChannelAddress: string;
    withdrawChannelAddress: string;
  }) => any;
  onSwap?: (inputSenderAmountWei: string, node: BrowserNode) => void;
  onDepositTxCreated?: (txHash: string) => void;
  onWithdrawalTxCreated?: (txHash: string) => void;
  onFinished?: (amountWei: string) => void;
};

const getFeesDebounced = AwesomeDebouncePromise(getCrosschainFee, 200);

const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  routerPublicIdentifier,
  depositChainProvider,
  depositAssetId: _depositAssetId,
  depositChainId: _depositChainId,
  withdrawChainProvider,
  withdrawAssetId: _withdrawAssetId,
  withdrawChainId: _withdrawChainId,
  withdrawalAddress,
  transferAmount: _transferAmount,
  injectedProvider: _injectedProvider,
  loginProvider: _loginProvider,
  iframeSrcOverride,
  withdrawCallTo,
  withdrawCallData,
  onClose,
  onReady,
  onSwap,
  onDepositTxCreated,
  onWithdrawalTxCreated,
  onFinished,
}) => {
  const depositAssetId = utils.getAddress(_depositAssetId);
  const withdrawAssetId = utils.getAddress(_withdrawAssetId);

  const [webProvider, setWebProvider] = useState<
    undefined | providers.Web3Provider
  >();

  const loginProvider: undefined | providers.Web3Provider = !!_loginProvider
    ? new providers.Web3Provider(_loginProvider)
    : undefined;

  const [transferAmountUi, setTransferAmountUi] = useState<
    string | undefined
  >();
  const [receivedAmountUi, setReceivedAmountUi] = useState<
    string | undefined
  >();
  const [transferFeeUi, setTransferFeeUi] = useState<string>('--');
  const [transferQuote, setTransferQuote] = useState<TransferQuote>();
  const [withdrawQuote, setWithdrawQuote] = useState<WithdrawalQuote>();

  const [successWithdrawalAmount, setSuccessWithdrawalAmount] = useState<
    string
  >();

  const [depositAddress, setDepositAddress] = useState<string>();

  const [withdrawChannel, _setWithdrawChannel] = useState<FullChannelState>();
  const withdrawChannelRef = React.useRef(withdrawChannel);
  const setWithdrawChannel = (data: FullChannelState) => {
    withdrawChannelRef.current = data;
    _setWithdrawChannel(data);
  };
  const [evts, setEvts] = useState<EvtContainer>();

  const [senderChain, setSenderChain] = useState<CHAIN_DETAIL>();
  const [receiverChain, setReceiverChain] = useState<CHAIN_DETAIL>();

  const [userBalance, setUserBalance] = useState<string>();

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [error, setError] = useState<Error>();
  const [amountError, setAmountError] = useState<string>();

  const [activeCrossChainTransferId, _setActiveCrossChainTransferId] = useState<
    string
  >(constants.HashZero);

  const [pendingTransferMessage, setPendingTransferMessage] = useState<
    string
  >();

  const [preImage, _setPreImage] = useState<string>();
  const preImageRef = React.useRef(preImage);
  const setPreImage = (data: string | undefined) => {
    preImageRef.current = data;
    _setPreImage(data);
  };

  const [listener, setListener] = useState<NodeJS.Timeout>();

  const activeCrossChainTransferIdRef = React.useRef(
    activeCrossChainTransferId
  );
  const setActiveCrossChainTransferId = (data: string) => {
    activeCrossChainTransferIdRef.current = data;
    _setActiveCrossChainTransferId(data);
  };

  const [node, setNode] = useState<BrowserNode | undefined>();

  const [swapDefinition, _setSwapDefinition] = useState();
  const swapRef = React.useRef(swapDefinition);
  const setSwapDefinition = (data: any) => {
    swapRef.current = data;
    _setSwapDefinition(data);
  };

  const [screenState, setScreenState] = useState<ScreenStates>(
    SCREEN_STATES.LOADING
  );

  const [lastScreenState, setLastScreenState] = useState<
    ScreenStates | undefined
  >();

  const [title, setTitle] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [showTimer, setShowTimer] = useState<boolean>(false);

  // temp
  const [inputReadOnly, setInputReadOnly] = useState<boolean>(false);

  const cancelTransfer = async (
    depositChannelAddress: string,
    withdrawChannelAddress: string,
    transferId: string,
    crossChainTransferId: string,
    _evts: EvtContainer,
    _node: BrowserNode
  ) => {
    // show a better screen here, loading UI
    handleScreen({
      state: ERROR_STATES.ERROR_TRANSFER,
      error: new Error('Cancelling transfer...'),
    });

    const senderResolution = _evts.CONDITIONAL_TRANSFER_RESOLVED.pipe(
      data =>
        data.transfer.meta.crossChainTransferId === crossChainTransferId &&
        data.channelAddress === depositChannelAddress
    ).waitFor(45_000);

    const receiverResolution = _evts.CONDITIONAL_TRANSFER_RESOLVED.pipe(
      data =>
        data.transfer.meta.crossChainTransferId === crossChainTransferId &&
        data.channelAddress === withdrawChannelAddress
    ).waitFor(45_000);
    try {
      await cancelToAssetTransfer(_node, withdrawChannelAddress, transferId);
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error in cancelToAssetTransfer',
      });
    }

    try {
      await Promise.all([senderResolution, receiverResolution]);
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: new Error('Transfer was cancelled'),
      });
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error waiting for sender and receiver cancellations',
      });
    }
  };

  const transfer = async (
    senderChainInfo: CHAIN_DETAIL,
    receiverChainInfo: CHAIN_DETAIL,
    _depositAddress: string,
    transferAmount: BigNumber,
    _evts: EvtContainer,
    _node: BrowserNode,
    verifyRouterCapacity: boolean
  ) => {
    const _depositChainId: number = senderChainInfo?.chainId!;
    const _withdrawChainId: number = receiverChainInfo?.chainId!;
    const _withdrawRpcProvider: providers.JsonRpcProvider = receiverChainInfo?.rpcProvider!;
    const crossChainTransferId = getRandomBytes32();
    setActiveCrossChainTransferId(crossChainTransferId);

    const statusTransferAmount = utils.formatUnits(
      transferAmount,
      senderChainInfo?.assetDecimals!
    );
    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: 'deposit detected',
      message: `Detected ${truncate(statusTransferAmount, 4)} ${
        senderChainInfo?.assetName
      } on ${senderChainInfo?.name}, transferring into state channel`,
    });

    try {
      console.log(
        `Calling reconcileDeposit with ${_depositAddress} and ${depositAssetId}`
      );
      await reconcileDeposit(_node, _depositAddress, depositAssetId);

      if (verifyRouterCapacity) {
        console.log('withdrawChannel: ', withdrawChannelRef.current);
        await verifyRouterCapacityForTransfer(
          _withdrawRpcProvider,
          withdrawAssetId,
          withdrawChannelRef.current!,
          transferAmount,
          swapRef.current
        );
      }
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error in reconcileDeposit',
      });

      return;
    }
    // call createFromAssetTransfer

    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: 'transferring',
      message: `Transferring ${truncate(
        statusTransferAmount,
        4
      )} ${senderChainInfo?.assetName!} from ${senderChainInfo?.name!} to ${
        receiverChainInfo?.name
      }. This step can take some time if the chain is congested`,
    });

    const preImage = getRandomBytes32();
    try {
      console.log(
        `Calling createFromAssetTransfer ${_depositChainId} ${depositAssetId} ${_withdrawChainId} ${withdrawAssetId} ${crossChainTransferId}`
      );
      const transferDeets = await createFromAssetTransfer(
        _node,
        _depositChainId,
        depositAssetId,
        _withdrawChainId,
        withdrawAssetId,
        routerPublicIdentifier,
        crossChainTransferId,
        preImage,
        transferQuote
      );
      console.log('createFromAssetTransfer transferDeets: ', transferDeets);
    } catch (e) {
      if (e.message.includes('Fees charged are greater than amount')) {
        handleScreen({ state: SCREEN_STATES.SWAP });
        setAmountError('Last requested transfer is lower than fees charged');
        return;
      }

      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error in createFromAssetTransfer:',
      });
      return;
    }
    setPreImage(preImage);

    // listen for a sender-side cancellation, if it happens, short-circuit and show cancellation
    const senderCancel = _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]
      .pipe(data => {
        return (
          data.transfer.meta?.routingId === crossChainTransferId &&
          data.transfer.responderIdentifier === routerPublicIdentifier &&
          Object.values(data.transfer.transferResolver)[0] ===
            constants.HashZero
        );
      })
      .waitFor(500_000);

    const receiverCreate = _evts[EngineEvents.CONDITIONAL_TRANSFER_CREATED]
      .pipe(data => {
        return (
          data.transfer.meta?.routingId === crossChainTransferId &&
          data.transfer.initiatorIdentifier === routerPublicIdentifier
        );
      })
      .waitFor(500_000);

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
        console.error('Transfer was cancelled');
        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: new Error('Transfer was cancelled'),
        });
        return;
      }
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message:
          'Did not receive transfer after 500 seconds, please try again later or attempt recovery',
      });

      return;
    }

    const senderResolve = _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]
      .pipe(data => {
        return (
          data.transfer.meta?.routingId === crossChainTransferId &&
          data.transfer.responderIdentifier === routerPublicIdentifier
        );
      })
      .waitFor(45_000);

    try {
      await resolveToAssetTransfer(
        _node,
        _withdrawChainId,
        preImage,
        crossChainTransferId,
        routerPublicIdentifier
      );
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error in resolveToAssetTransfer:',
      });

      return;
    }
    setPreImage(undefined);

    try {
      await senderResolve;
    } catch (e) {
      console.warn(
        'Did not find resolve event from router, proceeding with withdrawal',
        e
      );
    }

    await withdraw(receiverChainInfo, _node, onWithdrawalTxCreated, onFinished);
  };

  const withdraw = async (
    receiverChainInfo: CHAIN_DETAIL,
    _node: BrowserNode,
    _onWithdrawalTxCreated?: (txHash: string) => void,
    _onFinished?: (amountWei: string) => void
  ) => {
    const _withdrawChainId: number = receiverChainInfo?.chainId!;
    const _withdrawRpcProvider: providers.JsonRpcProvider = receiverChainInfo?.rpcProvider!;

    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: 'withdrawing',
      message: `withdrawing ${senderChain?.assetName} to ${receiverChain?.name}. This step can take some time if the chain is congested`,
    });

    // now go to withdrawal screen
    let result;
    try {
      result = await withdrawToAsset(
        _node,
        _withdrawChainId,
        withdrawAssetId,
        withdrawalAddress,
        routerPublicIdentifier,
        withdrawCallTo,
        withdrawCallData,
        withdrawQuote
      );
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error in crossChainTransfer',
      });
      return;
    }
    // display tx hash through explorer -> handles by the event.
    console.log('crossChainTransfer: ', result);
    setWithdrawTx(result.withdrawalTx);
    if (_onWithdrawalTxCreated) {
      _onWithdrawalTxCreated(result.withdrawalTx);
    }

    const successWithdrawalUi = utils.formatUnits(
      result.withdrawalAmount,
      receiverChain?.assetDecimals!
    );
    setSuccessWithdrawalAmount(successWithdrawalUi);

    handleScreen({ state: SCREEN_STATES.SUCCESS });

    // check tx receipt for withdrawal tx
    _withdrawRpcProvider
      .waitForTransaction(result.withdrawalTx)
      .then(receipt => {
        if (receipt.status === 0) {
          // tx reverted
          console.error('Transaction reverted onchain', receipt);
          handleScreen({
            state: ERROR_STATES.ERROR_TRANSFER,
            error: new Error('Withdrawal transaction reverted'),
          });
          return;
        }
      });

    if (_onFinished) {
      _onFinished(result.withdrawalAmount);
    }
  };

  const depositListenerAndTransfer = async (
    _depositChainId: number,
    _withdrawChainId: number,
    _depositAddress: string,
    _depositRpcProvider: providers.JsonRpcProvider,
    _withdrawRpcProvider: providers.JsonRpcProvider,
    _evts: EvtContainer,
    _node: BrowserNode
  ) => {
    handleScreen({ state: SCREEN_STATES.LISTENER });
    setShowTimer(true);
    let initialDeposits: BigNumber;
    try {
      initialDeposits = await getTotalDepositsBob(
        _depositAddress,
        depositAssetId,
        _depositRpcProvider
      );
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error getting total deposits',
      });

      return;
    }
    console.log(
      `Starting balance on ${_depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${initialDeposits.toString()}`
    );

    let depositListener = setInterval(async () => {
      let updatedDeposits: BigNumber;
      try {
        updatedDeposits = await getTotalDepositsBob(
          _depositAddress,
          depositAssetId,
          _depositRpcProvider
        );
      } catch (e) {
        console.warn(`Error fetching balance: ${e.message}`);
        return;
      }
      console.log(
        `Updated balance on ${_depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${updatedDeposits.toString()}`
      );

      if (updatedDeposits.lt(initialDeposits)) {
        initialDeposits = updatedDeposits;
      }

      if (updatedDeposits.gt(initialDeposits)) {
        clearInterval(depositListener!);
        setShowTimer(false);
        const transferAmount = updatedDeposits.sub(initialDeposits);
        initialDeposits = updatedDeposits;
        await transfer(
          senderChain!,
          receiverChain!,
          _depositAddress,
          transferAmount,
          _evts,
          _node,
          true
        );
      }
    }, 5_000);
    setListener(depositListener);
  };

  const handleAmountError = (
    err: string | undefined,
    receiveExactAmount: boolean
  ) => {
    setAmountError(err);
    clearInterval(listener!);
    if (receiveExactAmount) {
      setTransferAmountUi('');
    } else {
      setReceivedAmountUi('');
    }
  };

  const handleSwapCheck = async (
    _input: string | undefined,
    receiveExactAmount: boolean
  ) => {
    let err: string | undefined = undefined;
    const input = _input ? _input.trim() : undefined;

    setAmountError(undefined);
    if (!input) {
      setTransferFeeUi('--');
      setTransferAmountUi('');
      setReceivedAmountUi('');
      return;
    }

    try {
      if (receiveExactAmount) {
        setReceivedAmountUi(input);
      } else {
        setTransferAmountUi(input);
      }
      const transferAmountBn = BigNumber.from(
        utils.parseUnits(input, senderChain?.assetDecimals!)
      );

      if (transferAmountBn.isZero()) {
        err = 'Transfer amount cannot be 0';
        handleAmountError(err, receiveExactAmount);
        return;
      }

      let fee: BigNumber;
      let senderAmount: BigNumber;
      let recipientAmount: BigNumber;
      try {
        const {
          totalFee,
          senderAmount: _senderAmount,
          recipientAmount: _recipientAmount,
          transferQuote: _transferQuote,
          withdrawalQuote: _withdrawQuote,
        } = await getFeesDebounced(
          node!,
          routerPublicIdentifier,
          transferAmountBn,
          senderChain?.chainId!,
          senderChain?.assetId!,
          senderChain?.assetDecimals!,
          receiverChain?.chainId!,
          receiverChain?.assetId!,
          receiverChain?.assetDecimals!,
          withdrawChannelRef.current!.channelAddress,
          swapDefinition!,
          receiveExactAmount
        );
        fee = totalFee;
        senderAmount = BigNumber.from(_senderAmount);
        recipientAmount = BigNumber.from(_recipientAmount);
        setTransferQuote(_transferQuote);
        setWithdrawQuote(_withdrawQuote);
      } catch (e) {
        handleAmountError(err, receiveExactAmount);
        return;
      }

      const feeUi = utils.formatUnits(fee, senderChain!.assetDecimals);
      console.log('feeUi: ', feeUi);
      setTransferFeeUi(feeUi);

      if (BigNumber.from(recipientAmount).lte(0)) {
        const err = 'Not enough amount to pay fees';
        handleAmountError(err, receiveExactAmount);
        return;
      }

      if (receiveExactAmount) {
        const senderUi = utils.formatUnits(
          senderAmount,
          senderChain!.assetDecimals
        );
        console.log('senderUi: ', senderUi);
        setTransferAmountUi(senderUi);
      } else {
        const receivedUi = utils.formatUnits(
          recipientAmount,
          receiverChain!.assetDecimals
        );
        console.log('receivedUi: ', receivedUi);
        setReceivedAmountUi(receivedUi);
      }

      if (userBalance) {
        const userBalanceBn = BigNumber.from(
          utils.parseUnits(userBalance, senderChain?.assetDecimals!)
        );
        if (senderAmount.gt(userBalanceBn)) {
          err = 'Transfer amount exceeds user balance';
          handleAmountError(err, receiveExactAmount);
          return;
        }
      }
    } catch (e) {
      err = 'Invalid amount';
    }

    setAmountError(err);
    return;
  };

  const handleSwapRequest = async () => {
    setIsLoad(true);

    const _depositChainId: number = senderChain?.chainId!;
    const _withdrawChainId: number = receiverChain?.chainId!;
    const _depositAddress: string = depositAddress!;
    const _depositRpcProvider: providers.JsonRpcProvider = senderChain?.rpcProvider!;
    const _withdrawRpcProvider: providers.JsonRpcProvider = receiverChain?.rpcProvider!;
    const _node: BrowserNode = node!;
    const _evts: EvtContainer = evts!;
    const transferAmountBn: BigNumber = BigNumber.from(
      utils.parseUnits(transferAmountUi!, senderChain?.assetDecimals!)
    );

    if (
      !_depositChainId ||
      !_withdrawChainId ||
      !_depositAddress ||
      !_withdrawRpcProvider ||
      !_node ||
      !_evts
    ) {
      // TODO: handle this better
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: new Error('Missing input fields'),
      });
      setIsLoad(false);
      return;
    }
    if (onSwap) {
      onSwap(transferAmountBn.toString(), _node);
    }

    console.log('Verify Router Capacity');
    try {
      await verifyRouterCapacityForTransfer(
        _withdrawRpcProvider,
        withdrawAssetId,
        withdrawChannelRef.current!,
        transferAmountBn,
        swapRef.current
      );
      console.log(
        `Transferring ${transferAmountBn.toString()} through injected provider`
      );
    } catch (e) {
      console.log('verify', e);
      handleAmountError(e.message, false);
      setIsLoad(false);
      return;
    }

    if (!webProvider) {
      console.log(`Starting block listener`);
      // display QR
      setIsLoad(false);
      await depositListenerAndTransfer(
        _depositChainId,
        _withdrawChainId,
        _depositAddress,
        _depositRpcProvider,
        _withdrawRpcProvider,
        _evts,
        _node
      );
    } else {
      // deposit
      try {
        const signer = webProvider.getSigner();
        const depositTx =
          depositAssetId === constants.AddressZero
            ? await signer.sendTransaction({
                to: _depositAddress,
                value: transferAmountBn,
              })
            : await new Contract(depositAssetId, ERC20Abi, signer).transfer(
                _depositAddress,
                transferAmountBn
              );

        console.log('depositTx', depositTx.hash);
        if (onDepositTxCreated) {
          onDepositTxCreated(depositTx.hash);
        }
        const receipt = await depositTx.wait();
        console.log('deposit mined:', receipt.transactionHash);
      } catch (e) {
        setIsLoad(false);
        if (
          e.message.includes(
            'MetaMask Tx Signature: User denied transaction signature'
          )
        ) {
          return;
        }
        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: e,
          message: 'Error in injected provider deposit: ',
        });
        return;
      }
      setIsLoad(false);
      await transfer(
        senderChain!,
        receiverChain!,
        _depositAddress,
        transferAmountBn,
        _evts,
        _node,
        false
      );
    }
  };

  const stateReset = () => {
    handleScreen({ state: SCREEN_STATES.LOADING });
    setWebProvider(undefined);
    setPendingTransferMessage(undefined);
    setInputReadOnly(false);
    setIsLoad(false);
    setTransferFeeUi('--');
    setReceivedAmountUi('');
    setTransferQuote(undefined);
    setWithdrawQuote(undefined);
    setUserBalance(undefined);
    setError(undefined);
    setDepositAddress(undefined);
    setActiveCrossChainTransferId(constants.HashZero);
    setPreImage(undefined);
  };

  const setup = async () => {
    // set web provider
    setMessage('getting chains info...');
    const injectedProvider:
      | undefined
      | providers.Web3Provider = !!_injectedProvider
      ? new providers.Web3Provider(_injectedProvider)
      : undefined;

    setWebProvider(injectedProvider);

    // get chain info
    let senderChainInfo: CHAIN_DETAIL;
    try {
      senderChainInfo = await getChain(
        _depositChainId,
        depositChainProvider,
        depositAssetId
      );
      setSenderChain(senderChainInfo);
    } catch (e) {
      const message = 'Failed to fetch sender chain info';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });

      return;
    }

    let receiverChainInfo: CHAIN_DETAIL;
    try {
      receiverChainInfo = await getChain(
        _withdrawChainId,
        withdrawChainProvider,
        withdrawAssetId
      );
      setReceiverChain(receiverChainInfo);
    } catch (e) {
      const message = 'Failed to fetch receiver chain info';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    // handle if _transferAmount provided
    if (_transferAmount) {
      try {
        setInputReadOnly(true);
        setTransferAmountUi(_transferAmount);
      } catch (e) {
        const message = 'Error with transferAmount param';
        console.log(e, message);
        handleScreen({
          state: ERROR_STATES.ERROR_SETUP,
          error: e,
          message: message,
        });
        return;
      }
    }

    // handle if injectedProvider provided
    if (injectedProvider) {
      try {
        const network = await injectedProvider.getNetwork();
        console.log(network);
        if (senderChainInfo.chainId !== network.chainId) {
          const message = `Please connect your wallet to the ${senderChainInfo.name} : ${senderChainInfo.chainId} network`;
          const defaultMetmaskNetworks = [1, 3, 4, 5, 42];

          const _state: ErrorStates =
            // @ts-ignore
            ethereum &&
            // @ts-ignore
            ethereum.isMetaMask &&
            !defaultMetmaskNetworks.includes(senderChainInfo.chainId)
              ? ERROR_STATES.ERROR_NETWORK
              : ERROR_STATES.ERROR_SETUP;
          handleScreen({
            state: _state,
            error: new Error(message),
            title: 'Switch Network',
            message: message,
          });
          return;
        }

        const _userBalance = await getUserBalance(
          injectedProvider,
          senderChainInfo
        );
        setUserBalance(_userBalance);
      } catch (e) {
        const message = e.message;
        console.log(e, message);
        handleScreen({
          state: ERROR_STATES.ERROR_SETUP,
          error: e,
          title: 'Switch Network',
          message: message,
        });
        return;
      }
    }

    // setting up channels...
    setMessage('Setting up channels...');
    let _node: BrowserNode;
    try {
      // browser node object
      _node =
        node ??
        (await connectNode(
          routerPublicIdentifier,
          senderChainInfo.chainId,
          receiverChainInfo.chainId,
          senderChainInfo.chainProvider,
          receiverChainInfo.chainProvider,
          loginProvider,
          iframeSrcOverride
        ));
      setNode(_node);
    } catch (e) {
      if (e.message.includes('localStorage not available in this window')) {
        alert(
          'Please disable shields or ad blockers and try again. Connext requires cross-site cookies to store your channel states.'
        );
      }
      if (e.message.includes("Failed to read the 'localStorage'")) {
        alert(
          'Please disable shields or ad blockers or allow third party cookies in your browser and try again. Connext requires cross-site cookies to store your channel states.'
        );
      }
      const message = 'Error initalizing Browser Node';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    console.log('INITIALIZED BROWSER NODE');

    // create evt containers
    const _evts = evts ?? createEvtContainer(_node);
    setEvts(_evts);

    let depositChannel: FullChannelState;
    try {
      depositChannel = await getChannelForChain(
        _node,
        routerPublicIdentifier,
        senderChainInfo.chainId
      );
      console.log('SETTING DepositChannel: ', depositChannel);
    } catch (e) {
      const message = 'Could not get sender channel';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }
    const _depositAddress = depositChannel!.channelAddress;
    setDepositAddress(_depositAddress);

    let _withdrawChannel: FullChannelState;
    try {
      _withdrawChannel = await getChannelForChain(
        _node,
        routerPublicIdentifier,
        receiverChainInfo.chainId
      );
      console.log('SETTING _withdrawChannel: ', _withdrawChannel);
      setWithdrawChannel(_withdrawChannel);
    } catch (e) {
      const message = 'Could not get receiver channel';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    // callback for ready
    if (onReady) {
      onReady({
        depositChannelAddress: depositChannel.channelAddress,
        withdrawChannelAddress: _withdrawChannel.channelAddress,
      });
    }

    //
    setMessage('Verify router supports...');
    try {
      const swap = await verifyAndGetRouterSupports(
        _node,
        senderChainInfo.chainId,
        senderChainInfo.assetId,
        receiverChainInfo.chainId,
        receiverChainInfo.assetId,
        receiverChainInfo.rpcProvider,
        routerPublicIdentifier
      );
      setSwapDefinition(swap);
    } catch (e) {
      const message = 'Error in verifyRouterSupports';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    // prune any existing receiver transfers
    try {
      const hangingResolutions = await cancelHangingToTransfers(
        _node,
        _evts[EngineEvents.CONDITIONAL_TRANSFER_CREATED],
        senderChainInfo.chainId,
        receiverChainInfo.chainId,
        receiverChainInfo.assetId,
        routerPublicIdentifier
      );
      console.log('Found hangingResolutions: ', hangingResolutions);
    } catch (e) {
      const message = 'Error in cancelHangingToTransfers';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    // Checking for pending Cross-Chain Transfers...
    setMessage('looking for pending Transfers...');
    const [depositActive, withdrawActive] = await Promise.all([
      _node.getActiveTransfers({
        channelAddress: depositChannel.channelAddress,
      }),
      _node.getActiveTransfers({
        channelAddress: _withdrawChannel.channelAddress,
      }),
    ]);
    const depositHashlock = depositActive
      .getValue()
      .filter(t => Object.keys(t.transferState).includes('lockHash'));
    const withdrawHashlock = withdrawActive
      .getValue()
      .filter(t => Object.keys(t.transferState).includes('lockHash'));
    console.warn(
      'deposit active on init',
      depositHashlock.length,
      'ids:',
      depositHashlock.map(t => t.transferId)
    );
    console.warn(
      'withdraw active on init',
      withdrawHashlock.length,
      'ids:',
      withdrawHashlock.map(t => t.transferId)
    );

    // set a listener to check for transfers that may have been pushed after a refresh after the hanging transfers have already been canceled
    _evts.CONDITIONAL_TRANSFER_CREATED.pipe(data => {
      return (
        data.transfer.responderIdentifier === _node.publicIdentifier &&
        data.transfer.meta.routingId !== activeCrossChainTransferIdRef.current
      );
    }).attach(async data => {
      console.warn('Cancelling transfer thats not active');
      await cancelTransfer(
        _depositAddress,
        _withdrawChannel.channelAddress,
        data.transfer.transferId,
        data.transfer.meta.crossChainTransferId,
        _evts!,
        _node
      );
    });

    try {
      console.log('Waiting for sender cancellations..');
      await waitForSenderCancels(
        _node,
        _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED],
        depositChannel.channelAddress
      );
      console.log('done!');
    } catch (e) {
      const message = 'Error in waitForSenderCancels';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    try {
      await reconcileDeposit(
        _node,
        depositChannel.channelAddress,
        depositAssetId
      );
    } catch (e) {
      const message = 'Error in reconcileDeposit';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    // After reconciling, get channel again
    try {
      depositChannel = await getChannelForChain(
        _node,
        routerPublicIdentifier,
        senderChainInfo.chainId
      );
    } catch (e) {
      const message = 'Could not get sender channel';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    const offChainDepositAssetBalance = BigNumber.from(
      getBalanceForAssetId(depositChannel, depositAssetId, 'bob')
    );
    console.log(
      `Offchain balance for ${_depositAddress} of asset ${depositAssetId}: ${offChainDepositAssetBalance}`
    );

    const offChainWithdrawAssetBalance = BigNumber.from(
      getBalanceForAssetId(_withdrawChannel, withdrawAssetId, 'bob')
    );
    console.log(
      `Offchain balance for ${_withdrawChannel.channelAddress} of asset ${withdrawAssetId}: ${offChainWithdrawAssetBalance}`
    );

    if (
      offChainDepositAssetBalance.gt(0) &&
      offChainWithdrawAssetBalance.gt(0)
    ) {
      console.warn(
        'Balance exists in both channels, transferring first, then withdrawing'
      );
    }
    // if offChainDepositAssetBalance > 0
    if (offChainDepositAssetBalance.gt(0)) {
      // then start transfer
      setPendingTransferMessage(`Detected Pending Cross-Chain Transfer`);
      await transfer(
        senderChainInfo,
        receiverChainInfo,
        _depositAddress,
        offChainDepositAssetBalance,
        _evts,
        _node,
        true
      );
    }

    // if offchainWithdrawBalance > 0
    else if (offChainWithdrawAssetBalance.gt(0)) {
      // then go to withdraw screen with transfer amount == balance
      setPendingTransferMessage(`Detected Pending Cross-Chain Transfer`);
      await withdraw(
        receiverChainInfo,
        _node,
        onWithdrawalTxCreated,
        onFinished
      );
    }

    // if both are zero, register listener and display
    // QR code
    else {
      handleScreen({ state: SCREEN_STATES.SWAP });
    }
  };

  const init = async () => {
    if (!showModal) {
      return;
    }

    stateReset();
    setup();
  };

  useEffect(() => {
    init();
  }, [showModal]);

  const handleOptions = () => {
    return (
      <Options
        state={screenState}
        onClose={handleClose}
        handleRecoveryButton={handleRecoveryButton}
      />
    );
  };

  const handleBack = () => {
    return (
      <BackButton
        isDisabled={
          !lastScreenState ||
          [
            SCREEN_STATES.LOADING,
            SCREEN_STATES.STATUS,
            ...Object.values(ERROR_STATES),
          ].includes(lastScreenState as any)
            ? true
            : false
        }
        onClick={() => {
          clearInterval(listener!);
          handleScreen({ state: lastScreenState! });
        }}
      />
    );
  };

  const handleClose = () => {
    clearInterval(listener!);
    setShowTimer(false);
    onClose();
  };
  const handleCloseButton = () => {
    return (
      <CloseButton
        isDisabled={
          [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(
            screenState as any
          )
            ? true
            : false
        }
        onClick={onClose}
      />
    );
  };

  const handleRecoveryButton = () => {
    console.log('click on recovery button', screenState);
    switch (screenState) {
      case SCREEN_STATES.RECOVERY:
        handleScreen({ state: SCREEN_STATES.SWAP });
        return;

      default:
        handleScreen({ state: SCREEN_STATES.RECOVERY });
        return;
    }
  };

  const switchNetwork = async () => {
    console.log(senderChain?.chainParams!);
    // @ts-ignore
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [senderChain?.chainParams!],
    });

    init();
  };

  const handleScreen = (params: {
    state: ScreenStates;
    error?: Error | undefined;
    title?: string;
    message?: string;
  }) => {
    const { state, error: pError, title: pTitle, message: pMessage } = params;
    switch (state) {
      case SCREEN_STATES.LOADING:
        break;

      case SCREEN_STATES.SWAP:
        break;

      case SCREEN_STATES.SUCCESS:
        break;

      case SCREEN_STATES.RECOVERY:
        break;

      case SCREEN_STATES.LISTENER:
        break;

      case SCREEN_STATES.STATUS:
        setTitle(pTitle);
        setMessage(pMessage);
        break;

      default:
        console.log(pMessage);
        const _title = pTitle
          ? pTitle
          : state === ERROR_STATES.ERROR_TRANSFER
          ? 'Transfer Error'
          : 'Setup Error';

        setTitle(_title);
        setError(pError);
        setPreImage(undefined);
        break;
    }
    setScreenState((prevState: ScreenStates) => {
      setLastScreenState(prevState);
      return state;
    });
    return;
  };

  const activeScreen = (state: ScreenStates) => {
    switch (state) {
      case SCREEN_STATES.LOADING:
        return <Loading message={message!} />;

      case SCREEN_STATES.STATUS:
        return (
          <Status
            title={title!}
            message={message!}
            pendingTransferMessage={pendingTransferMessage}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            options={handleOptions}
          />
        );

      case SCREEN_STATES.SWAP:
        return (
          <Swap
            onUserInput={handleSwapCheck}
            swapRequest={handleSwapRequest}
            isLoad={isLoad}
            inputReadOnly={inputReadOnly}
            userBalance={userBalance}
            amountError={amountError}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            senderAmount={transferAmountUi}
            recipientAmount={receivedAmountUi}
            feeQuote={transferFeeUi}
            options={handleOptions}
          />
        );

      case SCREEN_STATES.RECOVERY:
        console.log('return recovery');
        return (
          <Recover
            senderChainInfo={senderChain!}
            node={node!}
            depositAddress={depositAddress!}
            handleOptions={handleOptions}
            handleBack={handleBack}
            handleCloseButton={handleCloseButton}
          />
        );

      case SCREEN_STATES.LISTENER:
        return (
          <SwapListener
            showTimer={showTimer}
            senderChannelAddress={depositAddress!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            options={handleOptions}
            handleBack={handleBack}
          />
        );

      case SCREEN_STATES.SUCCESS:
        return (
          <Success
            amount={successWithdrawalAmount!}
            transactionId={withdrawTx!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            onClose={handleCloseButton}
            options={handleOptions}
          />
        );

      default:
        return (
          <ErrorScreen
            error={error ?? new Error('unknown')}
            title={title!}
            retry={init}
            switchNetwork={switchNetwork}
            state={state}
            crossChainTransferId={activeCrossChainTransferId}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            handleRecoveryButton={handleRecoveryButton}
            options={handleOptions}
            handleBack={handleBack}
          />
        );
    }
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <Fonts />
        <Modal
          id="modal"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          isOpen={showModal}
          size="md"
          onClose={handleClose}
          scrollBehavior="inside"
          isCentered
        >
          <ModalOverlay />
          <ModalContentContainer>
            {activeScreen(screenState)}
          </ModalContentContainer>
        </Modal>
      </ThemeProvider>
    </>
  );
};

export default ConnextModal;
