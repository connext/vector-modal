import { BrowserNode } from '@connext/vector-browser-node';
import React, { FC, useEffect, useState } from 'react';
import { Grid, Typography, Alert, Link } from '@material-ui/core';
import {
  ChakraProvider,
  Modal,
  ModalOverlay,
  useDisclosure,
  Button,
} from '@chakra-ui/react';
// @ts-ignore
import QRCode from 'qrcode.react';
import { BigNumber, constants, utils, providers, Contract } from 'ethers';
import {
  EngineEvents,
  ERC20Abi,
  FullChannelState,
} from '@connext/vector-types';
import { getBalanceForAssetId, getRandomBytes32 } from '@connext/vector-utils';
import {
  TRANSFER_STATES,
  ERROR_STATES,
  SCREEN_STATES,
  CHAIN_DETAIL,
  useStyles,
  ScreenStates,
  ErrorStates,
} from '../constants';
import {
  getAssetName,
  getExplorerLinkForAsset,
  getTotalDepositsBob,
  reconcileDeposit,
  createEvtContainer,
  EvtContainer,
  verifyRouterSupportsTransfer,
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
} from '../utils';
// import Loading from './Loading';
import { Input as NumericalInput } from './NumericalInput';
import Options from './Options';
import Recover from './Recover';
import ErrorScreen from './ErrorScreen';
import SuccessScreen from './SuccessScreen';
import {
  Email,
  Login,
  Loading,
  Menu,
  Transfer,
  TransferAddress,
  Status,
  ErrorTransfer,
  ErrorSetup,
  Success,
} from './pages';

export { useDisclosure };

export type NewModalProps = {
  showModal: boolean;
  routerPublicIdentifier: string;
  depositChainId?: number;
  depositChainProvider: string;
  depositAssetId: string;
  withdrawChainProvider: string;
  withdrawChainId?: number;
  withdrawAssetId: string;
  withdrawalAddress: string;
  onClose: () => void;
  onReady?: (params: {
    depositChannelAddress: string;
    withdrawChannelAddress: string;
  }) => any;
  transferAmount?: string;
  injectedProvider?: any;
  onDepositTxCreated?: (txHash: string) => void;
  onWithdrawalTxCreated?: (txHash: string) => void;
};

const NewModal: FC<NewModalProps> = ({
  showModal,
  routerPublicIdentifier,
  depositChainProvider,
  depositAssetId: _depositAssetId,
  depositChainId: _depositChainId,
  withdrawChainProvider,
  withdrawAssetId: _withdrawAssetId,
  withdrawChainId: _withdrawChainId,
  withdrawalAddress,
  onClose,
  onReady,
  transferAmount: _transferAmount,
  injectedProvider: _injectedProvider,
  onDepositTxCreated,
  onWithdrawalTxCreated,
}) => {
  const depositAssetId = utils.getAddress(_depositAssetId);
  const withdrawAssetId = utils.getAddress(_withdrawAssetId);
  const injectedProvider:
    | undefined
    | providers.Web3Provider = !!_injectedProvider
    ? new providers.Web3Provider(_injectedProvider)
    : undefined;
  const classes = useStyles();
  const [transferAmountWei, setTransferAmountWei] = useState<
    string | undefined
  >(_transferAmount);
  const [transferAmountUi, setTransferAmountUi] = useState<string>();
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

  const [userBalance, setUserBalance] = useState<string>('——');

  const [sentAmount, setSentAmount] = useState<string>('0');

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error>();
  const [amountError, setAmountError] = useState<string>();

  const [activeCrossChainTransferId, _setActiveCrossChainTransferId] = useState<
    string
  >(constants.HashZero);

  const [preImage, _setPreImage] = useState<string>();
  const preImageRef = React.useRef(preImage);
  const setPreImage = (data: string | undefined) => {
    preImageRef.current = data;
    _setPreImage(data);
  };

  const [listener, setListener] = useState<NodeJS.Timeout>();

  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));

  const activeCrossChainTransferIdRef = React.useRef(
    activeCrossChainTransferId
  );
  const setActiveCrossChainTransferId = (data: string) => {
    activeCrossChainTransferIdRef.current = data;
    _setActiveCrossChainTransferId(data);
  };

  const [node, setNode] = useState<BrowserNode | undefined>();

  const [swap, _setSwap] = useState();
  const swapRef = React.useRef(swap);
  const setSwap = (data: any) => {
    swapRef.current = data;
    _setSwap(data);
  };

  const [screenState, setScreenState] = useState<ScreenStates>(
    SCREEN_STATES.LOADING
  );

  const [title, setTitle] = useState<string>();
  const [message, setMessage] = useState<string>();

  const handleError = (
    state: ErrorStates,
    e: Error | undefined,
    message?: string
  ) => {
    setError(e);
    setIsError(true);
    setPreImage(undefined);
    setScreenState(state);
  };

  const handleStatus = (title: string, message: string) => {
    setTitle(title);
    setMessage(message);
    setIsError(false);
    setScreenState(SCREEN_STATES.STATUS);
  };

  const cancelTransfer = async (
    depositChannelAddress: string,
    withdrawChannelAddress: string,
    transferId: string,
    crossChainTransferId: string,
    _evts: EvtContainer,
    _node: BrowserNode
  ) => {
    // show a better screen here, loading UI
    handleError(
      ERROR_STATES.ERROR_TRANSFER,
      new Error('Cancelling transfer...')
    );

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
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error in cancelToAssetTransfer'
      );
    }

    try {
      await Promise.all([senderResolution, receiverResolution]);
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        new Error('Transfer was cancelled')
      );
    } catch (e) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error waiting for sender and receiver cancellations'
      );
    }
  };

  const transfer = async (
    _depositChainId: number,
    _withdrawChainId: number,
    _depositAddress: string,
    _withdrawRpcProvider: providers.JsonRpcProvider,
    transferAmount: BigNumber,
    _evts: EvtContainer,
    _node: BrowserNode,
    verifyRouterCapacity: boolean
  ) => {
    const crossChainTransferId = getRandomBytes32();
    setActiveCrossChainTransferId(crossChainTransferId);

    handleStatus(
      'deposit detected',
      'Detected balance on chain, transferring into state channel'
    );
    setAmount(transferAmount);

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
      handleError(ERROR_STATES.ERROR_TRANSFER, e, 'Error in reconcileDeposit');
      return;
    }
    // call createFromAssetTransfer

    handleStatus(
      'transferring',
      'Transferring funds between chains. This step can take some time if the chain is congested'
    );

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
        preImage
      );
      console.log('createFromAssetTransfer transferDeets: ', transferDeets);
    } catch (e) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error in createFromAssetTransfer: '
      );
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
        handleError(
          ERROR_STATES.ERROR_TRANSFER,
          new Error('Transfer was cancelled'),
          undefined
        );
        return;
      }
    } catch (e) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Did not receive transfer after 500 seconds, please try again later or attempt recovery'
      );
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
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error in resolveToAssetTransfer: '
      );
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

    await withdraw(
      _withdrawChainId,
      _withdrawRpcProvider,
      _node,
      onWithdrawalTxCreated
    );
  };

  const handleInjectedProviderTransferAmountEntry = (
    input: string,
    _userBalance: string
  ): string | undefined => {
    let err: string | undefined = undefined;
    try {
      setTransferAmountUi(input.trim());
      setAmountError(undefined);
      const transferAmountBn = BigNumber.from(
        utils.parseUnits(input.trim(), senderChain!.assetDecimals)
      );
      setTransferAmountWei(transferAmountBn.toString());
      const userBalanceBn = BigNumber.from(
        utils.parseUnits(_userBalance, senderChain!.assetDecimals)
      );

      if (transferAmountBn.isZero()) {
        err = 'Transfer amount cannot be 0';
      }
      if (transferAmountBn.gt(userBalanceBn)) {
        err = 'Transfer amount exceeds user balance';
      }
    } catch (e) {
      err = 'Invalid amount';
    }
    setAmountError(err);
    return err;
  };

  const injectedProviderDeposit = async (
    _transferAmount: string,
    _depositChainId: number,
    _withdrawChainId: number,
    _depositAddress: string,
    _withdrawRpcProvider: providers.JsonRpcProvider,
    _node: BrowserNode,
    _evts: EvtContainer,
    _onDepositTxCreated?: (txHash: string) => void
  ) => {
    if (!injectedProvider) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        new Error('Missing injected provider')
      );
      return;
    }

    if (
      !_depositChainId ||
      !_withdrawChainId ||
      !_depositAddress ||
      !_withdrawRpcProvider ||
      !_node ||
      !_evts
    ) {
      // TODO: handle this better
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        new Error('Missing input fields')
      );
      return;
    }

    // deposit + reconcile
    const transferAmountBn = BigNumber.from(_transferAmount);
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

      const signer = injectedProvider.getSigner();
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

      setIsError(false);
      setAmount(transferAmountBn);
      console.log('depositTx', depositTx.hash);
      if (_onDepositTxCreated) {
        _onDepositTxCreated(depositTx.hash);
      }
      const receipt = await depositTx.wait();
      console.log('deposit mined:', receipt.transactionHash);
    } catch (e) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error in injected provider deposit: '
      );
      return;
    }

    await transfer(
      _depositChainId,
      _withdrawChainId,
      _depositAddress,
      _withdrawRpcProvider,
      transferAmountBn,
      _evts,
      _node,
      false
    );
  };

  const withdraw = async (
    _withdrawChainId: number,
    _withdrawRpcProvider: providers.JsonRpcProvider,
    _node: BrowserNode,
    _onWithdrawalTxCreated?: (txHash: string) => void
  ) => {
    handleStatus(
      'withdrawing',
      'withdrawing funds. This step can take some time if the chain is congested'
    );

    // now go to withdrawal screen
    let result;
    try {
      result = await withdrawToAsset(
        _node,
        _withdrawChainId,
        withdrawAssetId,
        withdrawalAddress,
        routerPublicIdentifier
      );
    } catch (e) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error in crossChainTransfer'
      );
      return;
    }
    // display tx hash through explorer -> handles by the event.
    console.log('crossChainTransfer: ', result);
    setWithdrawTx(result.withdrawalTx);
    if (_onWithdrawalTxCreated) {
      _onWithdrawalTxCreated(result.withdrawalTx);
    }
    setSentAmount(result.withdrawalAmount ?? '0');

    setScreenState(SCREEN_STATES.SUCCESS);
    setIsError(false);

    // check tx receipt for withdrawal tx
    _withdrawRpcProvider
      .waitForTransaction(result.withdrawalTx)
      .then(receipt => {
        if (receipt.status === 0) {
          // tx reverted
          // TODO: go to contact screen
          console.error('Transaction reverted onchain', receipt);
          handleError(
            ERROR_STATES.ERROR_TRANSFER,
            new Error('Withdrawal transaction reverted'),
            undefined
          );
          return;
        }
      });
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
    let initialDeposits: BigNumber;
    try {
      initialDeposits = await getTotalDepositsBob(
        _depositAddress,
        depositAssetId,
        _depositRpcProvider
      );
    } catch (e) {
      handleError(
        ERROR_STATES.ERROR_TRANSFER,
        e,
        'Error getting total deposits'
      );
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
        const transferAmount = updatedDeposits.sub(initialDeposits);
        initialDeposits = updatedDeposits;
        await transfer(
          _depositChainId,
          _withdrawChainId,
          _depositAddress,
          _withdrawRpcProvider,
          transferAmount,
          _evts,
          _node,
          true
        );
      }
    }, 5_000);
    setListener(depositListener);
  };

  const stateReset = () => {
    setScreenState(SCREEN_STATES.LOADING);
    setTransferAmountWei(_transferAmount);
    setUserBalance('——');
    setIsError(false);
    setError(undefined);
    setDepositAddress(undefined);
    setActiveCrossChainTransferId(constants.HashZero);
    setAmount(BigNumber.from(0));
    setPreImage(undefined);
  };

  const handleClose = () => {
    clearInterval(listener!);
    onClose();
  };

  const setup = async () => {
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
      return;
    }

    if (injectedProvider) {
      try {
        const network = await injectedProvider.getNetwork();
        if (senderChainInfo.chainId !== network.chainId) {
          throw new Error(
            `Please connect your wallet to the ${senderChainInfo.name} : ${senderChainInfo.chainId} network`
          );
        }
      } catch (e) {
        const message = 'Failed to get chainId from wallet provider';
        console.log(e, message);
        handleError(ERROR_STATES.ERROR_SETUP, e, message);
        return;
      }
    }

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
          receiverChainInfo.chainProvider
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
      return;
    }

    // callback for ready
    if (onReady) {
      onReady({
        depositChannelAddress: depositChannel.channelAddress,
        withdrawChannelAddress: _withdrawChannel.channelAddress,
      });
    }

    // validate router before proceeding
    const transferAmountBn = BigNumber.from(_transferAmount ?? 0);

    try {
      const swap = await verifyRouterSupportsTransfer(
        _node,
        senderChainInfo.chainId,
        senderChainInfo.assetId,
        receiverChainInfo.chainId,
        receiverChainInfo.assetId,
        receiverChainInfo.rpcProvider,
        routerPublicIdentifier,
        transferAmountBn
      );
      setSwap(swap);
    } catch (e) {
      const message = 'Error in verifyRouterSupportsTransfer';
      console.log(e, message);
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
      return;
    }

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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      handleError(ERROR_STATES.ERROR_SETUP, e, message);
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
      await transfer(
        senderChainInfo.chainId,
        receiverChainInfo.chainId,
        _depositAddress,
        receiverChainInfo.rpcProvider,
        offChainDepositAssetBalance,
        _evts,
        _node,
        true
      );
    }

    // if offchainWithdrawBalance > 0
    else if (offChainWithdrawAssetBalance.gt(0)) {
      // then go to withdraw screen with transfer amount == balance
      await withdraw(
        receiverChainInfo.chainId,
        receiverChainInfo.rpcProvider,
        _node,
        onWithdrawalTxCreated
      );
    }

    // if both are zero, register listener and display
    // QR code
    else {
      // sets up deposit screen
      const initialState =
        !!injectedProvider && !!transferAmountWei && transferAmountWei !== '0'
          ? TRANSFER_STATES.DEPOSITING
          : TRANSFER_STATES.INITIAL;

      if (initialState === TRANSFER_STATES.DEPOSITING) {
        // Modal user has provided transfer amount + injected provider
        // just automatically jump to deposit screen
        const _userBalance = await getUserBalance(
          injectedProvider!,
          senderChainInfo
        );
        const err = handleInjectedProviderTransferAmountEntry(
          utils.formatUnits(transferAmountWei!, senderChainInfo.assetDecimals),
          _userBalance
        );
        if (err) {
          handleError(ERROR_STATES.ERROR_TRANSFER, new Error(err), err);
          return;
        }
        await injectedProviderDeposit(
          transferAmountWei!,
          senderChainInfo.chainId,
          receiverChainInfo.chainId,
          _depositAddress,
          receiverChainInfo.rpcProvider,
          _node,
          _evts,
          onDepositTxCreated
        );
        return;
      }
      if (injectedProvider) {
        console.log(`Using injected provider, not listener.`);
        // using metamask, will be button-driven
        setIniting(false);
        await getUserBalance(injectedProvider, senderChainInfo);
        return;
      }
      console.log(`Starting block listener`);
      // display QR
      await depositListenerAndTransfer(
        senderChainInfo.chainId,
        receiverChainInfo.chainId,
        _depositAddress,
        senderChainInfo.rpcProvider,
        receiverChainInfo.rpcProvider,
        _evts,
        _node
      );
    }

    setIniting(false);
  };

  const init = async () => {
    if (!showModal) {
      return;
    }

    stateReset();
    setScreenState(SCREEN_STATES.LOADING);
    setup();
  };

  useEffect(() => {
    init();
  }, [showModal]);

  function getScreen(step: number) {
    if (isError) {
    } else {
      switch (step) {
        // DEPOSIT SCREEN
        case -1:
          return (
            <>
              <Grid
                container
                justifyContent="center"
                style={{
                  paddingBottom: '16px',
                }}
              >
                <Alert severity="warning">
                  Do not use this component in Incognito Mode{' '}
                </Alert>
              </Grid>
              {!!injectedProvider ? (
                <>
                  <Grid
                    container
                    justifyContent="center"
                    alignContent="center"
                    style={{ marginBottom: '16px', width: '80%' }}
                  >
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        style={{
                          fontSize: '14px',
                        }}
                        align="right"
                      >
                        Balance: {userBalance}{' '}
                        {getAssetName(depositAssetId, depositChainId!)}
                      </Typography>
                    </Grid>
                    <NumericalInput
                      label="amount"
                      name="amount"
                      aria-describedby="amount"
                      className="token-amount-input"
                      value={transferAmountUi ?? '0'}
                      onUserInput={val => {
                        handleInjectedProviderTransferAmountEntry(
                          val,
                          userBalance!
                        );
                      }}
                    />
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        style={{
                          fontSize: '11px',
                        }}
                        color={!!amountError ? `error` : `primary`}
                        align="left"
                      >
                        {!!amountError
                          ? amountError
                          : `From ${depositChainName}`}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Grid
                    container
                    justifyContent="center"
                    alignContent="center"
                    style={{ marginBottom: '16px' }}
                  >
                    <Button
                      variant="outlined"
                      disabled={!!amountError || !transferAmountWei}
                      style={{
                        width: '80%',
                        // color: '#212121',
                        // borderColor: '#212121',
                      }}
                      onClick={() =>
                        transferAmountWei &&
                        injectedProviderDeposit(
                          transferAmountWei,
                          depositChainId!,
                          withdrawChainId!,
                          depositAddress!,
                          withdrawRpcProvider!,
                          node!,
                          evts!,
                          onDepositTxCreated
                        )
                      }
                    >
                      Swap
                    </Button>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid
                    id="qrcode"
                    container
                    direction="row"
                    justifyContent="center"
                    alignItems="flex-start"
                    className={classes.qrcode}
                  >
                    <QRCode
                      value={depositAddress}
                      size={250}
                      includeMargin={true}
                    />
                  </Grid>
                  <Grid
                    container
                    justifyContent="center"
                    style={{
                      paddingBottom: '16px',
                    }}
                  >
                    <Alert severity="info">
                      <Typography variant="body1">
                        Send{' '}
                        <Link
                          href={getExplorerLinkForAsset(
                            depositChainId!,
                            depositAssetId
                          )}
                          target="_blank"
                          rel="noopener"
                        >
                          {getAssetName(depositAssetId, depositChainId!)}
                        </Link>{' '}
                        to the address below
                      </Typography>
                    </Alert>
                  </Grid>
                  <EthereumAddress
                    depositChainName={depositChainName!}
                    depositAddress={depositAddress!}
                    styles={classes.ethereumAddress}
                  />
                </>
              )}

              <Footer styles={classes.footer} />
            </>
          );

        default:
          return 'Unknown step';
      }
    }
  }

  const activeScreen = (state: ScreenStates) => {
    console.log('activeScreen:', state);
    switch (state) {
      case SCREEN_STATES.LOGIN:
        return <Login />;

      case SCREEN_STATES.EMAIL:
        return <Email />;

      case SCREEN_STATES.LOADING:
        return <Loading message="Setting up channels..." />;

      case SCREEN_STATES.STATUS:
        return (
          <Status
            title={title!}
            message={message!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
          />
        );

      case SCREEN_STATES.MENU:
        return <Menu />;

      case SCREEN_STATES.SUCCESS:
        return (
          <Success
            amount={amount.toString()}
            transactionId={withdrawTx!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
          />
        );

      case SCREEN_STATES.ERROR_SETUP:
        return (
          <ErrorSetup
            error={error ?? new Error('unknown')}
            retry={init}
            crossChainTransferId={activeCrossChainTransferId}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
          />
        );

      case SCREEN_STATES.ERROR_TRANSFER:
        return (
          <ErrorTransfer
            error={error ?? new Error('unknown')}
            retry={init}
            crossChainTransferId={activeCrossChainTransferId}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
          />
        );
    }
  };

  return (
    <>
      <ChakraProvider theme={theme}>
        <Modal
          id="modal"
          closeOnOverlayClick={false}
          isOpen={showModal}
          size="md"
          onClose={handleClose}
          scrollBehavior="inside"
          isCentered
        >
          <ModalOverlay />

          {activeScreen(screenState)}
        </Modal>
      </ChakraProvider>
    </>
  );
};

// export interface EthereumAddressProps {
//   depositChainName: string;
//   depositAddress: string;
//   styles: string;
// }

// const EthereumAddress: FC<EthereumAddressProps> = props => {
//   const { depositAddress, styles } = props;
//   const [copiedDepositAddress, setCopiedDepositAddress] = useState<boolean>(
//     false
//   );
//   return (
//     <>
//       <Grid container alignItems="flex-end" className={styles}>
//         <Grid item xs={12}>
//           <TextField
//             label={`Deposit Address on ${props.depositChainName}`}
//             size="medium"
//             defaultValue={depositAddress}
//             InputProps={{
//               readOnly: true,
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     onClick={() => {
//                       console.log(`Copying: ${depositAddress}`);
//                       navigator.clipboard.writeText(depositAddress);
//                       setCopiedDepositAddress(true);
//                       setTimeout(() => setCopiedDepositAddress(false), 5000);
//                     }}
//                     edge="end"
//                   >
//                     {!copiedDepositAddress ? <Copy /> : <Check />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//             fullWidth
//           />
//         </Grid>
//       </Grid>
//     </>
//   );
// };

export default NewModal;
