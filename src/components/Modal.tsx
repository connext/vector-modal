import { BrowserNode } from '@connext/vector-browser-node';
import React, { FC, useEffect, useState, ReactElement } from 'react';
import {
  Dialog,
  Grid,
  Button,
  Typography,
  TextField,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  Card,
  Chip,
  ThemeProvider,
  CircularProgress,
  StepIconProps,
  Alert,
  Link,
} from '@material-ui/core';
import {
  Copy,
  Check,
  CheckCircle,
  X,
  ChevronsRight,
  Circle,
  AlertCircle,
  Send,
} from 'react-feather';
// @ts-ignore
import QRCode from 'qrcode.react';
import { FeedbackFish } from '@feedback-fish/react';
import { BigNumber, constants, utils, providers, Contract } from 'ethers';
import {
  EngineEvents,
  ERC20Abi,
  FullChannelState,
} from '@connext/vector-types';
import {
  getBalanceForAssetId,
  getRandomBytes32,
  getChainId,
} from '@connext/vector-utils';
import {
  getAssetName,
  TRANSFER_STATES,
  TransferStates,
  ERROR_STATES,
  ErrorStates,
  Screens,
  message,
  theme,
  useStyles,
} from '../constants';
import {
  getExplorerLinkForTx,
  activePhase,
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
  getChainInfo,
  getWithdrawAssetDecimals,
  connectNode,
} from '../utils';
import Loading from './Loading';
import Options from './Options';
import Recover from './Recover';

export type ConnextModalProps = {
  showModal: boolean;
  routerPublicIdentifier: string;
  depositChainProvider: string;
  depositAssetId: string;
  withdrawChainProvider: string;
  withdrawAssetId: string;
  withdrawalAddress: string;
  onClose: () => void;
  onReady?: (params: {
    depositChannelAddress: string;
    withdrawChannelAddress: string;
  }) => any;
  transferAmount?: string;
  injectedProvider?: any;
};

const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  routerPublicIdentifier,
  depositChainProvider,
  depositAssetId: _depositAssetId,
  withdrawChainProvider,
  withdrawAssetId: _withdrawAssetId,
  withdrawalAddress,
  onClose,
  onReady,
  transferAmount: _transferAmount,
  injectedProvider: _injectedProvider,
}) => {
  const depositAssetId = utils.getAddress(_depositAssetId);
  const withdrawAssetId = utils.getAddress(_withdrawAssetId);
  const injectedProvider:
    | undefined
    | providers.Web3Provider = !!_injectedProvider
    ? new providers.Web3Provider(_injectedProvider)
    : undefined;
  const classes = useStyles();
  const [transferAmount, setTransferAmount] = useState<string | undefined>(
    _transferAmount
  );
  const [depositAddress, setDepositAddress] = useState<string>();

  const [depositChainId, setDepositChainId] = useState<number>();
  const [withdrawChainId, setWithdrawChainId] = useState<number>();
  // const [depositRpcProvider, setDepositRpcProvider] = useState<
  //   providers.JsonRpcProvider
  // >();
  const [withdrawRpcProvider, setWithdrawRpcProvider] = useState<
    providers.JsonRpcProvider
  >();
  const [evts, setEvts] = useState<EvtContainer>();

  const [depositChainName, setDepositChainName] = useState<string>();
  const [withdrawChainName, setWithdrawChainName] = useState<string>();
  const [withdrawAssetDecimals, setWithdrawAssetDecimals] = useState(18);
  const [sentAmount, setSentAmount] = useState<string>('0');

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [initing, setIniting] = useState<boolean>(true);

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

  const [screen, setScreen] = useState<Screens>('Home');
  const [listener, setListener] = useState<NodeJS.Timeout>();

  const [transferState, setTransferState] = useState<TransferStates>(
    TRANSFER_STATES.LOADING
  );
  const [errorState, setErrorState] = useState<ErrorStates>(ERROR_STATES.RETRY);
  const [activeMessage, setActiveMessage] = useState(0);
  const [activeHeaderMessage, setActiveHeaderMessage] = useState(0);

  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));

  const activeCrossChainTransferIdRef = React.useRef(
    activeCrossChainTransferId
  );
  const setActiveCrossChainTransferId = (data: string) => {
    activeCrossChainTransferIdRef.current = data;
    _setActiveCrossChainTransferId(data);
  };

  const [node, setNode] = useState<BrowserNode | undefined>();

  const activeStep = activePhase(transferState);

  const preventDefault = (event: React.SyntheticEvent) =>
    event.preventDefault();

  const handleError = (
    e: Error | undefined,
    message?: string,
    pErrorState?: ErrorStates
  ) => {
    if (message) {
      console.error(message, e);
    }

    setErrorState(ERROR_STATES.RETRY);
    if (pErrorState) {
      setErrorState(pErrorState);
    }
    setError(e);
    setIsError(true);
    setIniting(false);
    setPreImage(undefined);
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
    handleError(new Error('Cancelling transfer...'));

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
      handleError(e, 'Error in cancelToAssetTransfer');
    }

    try {
      await Promise.all([senderResolution, receiverResolution]);
      handleError(new Error('Transfer was cancelled'));
    } catch (e) {
      handleError(e, 'Error waiting for sender and receiver cancellations');
    }
  };

  const transfer = async (
    _depositChainId: number,
    _withdrawChainId: number,
    _depositAddress: string,
    _withdrawRpcProvider: providers.JsonRpcProvider,
    transferAmount: BigNumber,
    _evts: EvtContainer,
    _node: BrowserNode
  ) => {
    setActiveHeaderMessage(1);
    const crossChainTransferId = getRandomBytes32();
    setActiveCrossChainTransferId(crossChainTransferId);
    setTransferState(TRANSFER_STATES.DEPOSITING);
    setIsError(false);
    setAmount(transferAmount);

    try {
      console.log(
        `Calling reconcileDeposit with ${_depositAddress} and ${depositAssetId}`
      );
      await reconcileDeposit(_node, _depositAddress, depositAssetId);
    } catch (e) {
      handleError(e, 'Error in reconcileDeposit', ERROR_STATES.RETRY);
      return;
    }
    // call createFromAssetTransfer

    setTransferState(TRANSFER_STATES.TRANSFERRING);

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
      handleError(e, 'Error in createFromAssetTransfer: ', ERROR_STATES.RETRY);
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
          new Error('Transfer was cancelled'),
          undefined,
          ERROR_STATES.RETRY
        );
        return;
      }
    } catch (e) {
      handleError(
        e,
        'Did not receive transfer after 500 seconds, please try again later or attempt recovery',
        ERROR_STATES.RETRY
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
      handleError(e, 'Error in resolveToAssetTransfer: ', ERROR_STATES.RETRY);
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

    await withdraw(_withdrawChainId, _withdrawRpcProvider, _node);
  };

  const handleInjectedProviderTransferAmountEntry = (input: string) => {
    try {
      utils.parseEther(input.toString().trim());
      setTransferAmount(input);
    } catch (e) {
      setAmountError('Invalid amount');
      return;
    }
  };

  const injectedProviderDeposit = async () => {
    const amount = utils.parseEther(transferAmount ?? '0');
    if (!injectedProvider) {
      handleError(new Error('Missing injected provider'));
      return;
    }
    if (amount.isZero()) {
      handleError(new Error('Deposit amount cannot be 0'));
      return;
    }

    if (
      !depositChainId ||
      !withdrawChainId ||
      !depositAddress ||
      !withdrawRpcProvider ||
      !transferAmount ||
      !node ||
      !evts
    ) {
      // TODO: handle this better
      handleError(new Error('Missing react state fields'));
      return;
    }

    try {
      const network = await injectedProvider.getNetwork();
      if (depositChainId !== network.chainId) {
        throw new Error('Please connect to the correct network');
      }
    } catch (e) {
      handleError(e, 'Failed to get chainId from injected provider');
      return;
    }

    // deposit + reconcile
    const signer = injectedProvider.getSigner();
    const depositTx =
      depositAssetId === constants.AddressZero
        ? signer.sendTransaction({
            to: depositAddress,
            value: amount,
          })
        : await new Contract(depositAssetId, ERC20Abi, signer).transfer(
            depositAddress,
            amount
          );
    console.log('depositTx', depositTx.hash);
    const receipt = await depositTx.wait();
    console.log('deposit mined:', receipt.transactionHash);

    await transfer(
      depositChainId,
      withdrawChainId,
      depositAddress,
      withdrawRpcProvider,
      amount,
      evts,
      node
    );
  };

  const withdraw = async (
    _withdrawChainId: number,
    _withdrawRpcProvider: providers.JsonRpcProvider,
    _node: BrowserNode
  ) => {
    setTransferState(TRANSFER_STATES.WITHDRAWING);

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
      handleError(e, 'Error in crossChainTransfer', ERROR_STATES.RETRY);
      return;
    }
    // display tx hash through explorer -> handles by the event.
    console.log('crossChainTransfer: ', result);
    setWithdrawTx(result.withdrawalTx);
    setSentAmount(result.withdrawalAmount ?? '0');
    setTransferState(TRANSFER_STATES.COMPLETE);

    setIsError(false);
    setActiveHeaderMessage(2);

    // check tx receipt for withdrawal tx
    _withdrawRpcProvider
      .waitForTransaction(result.withdrawalTx)
      .then(receipt => {
        if (receipt.status === 0) {
          // tx reverted
          // TODO: go to contact screen
          console.error('Transaction reverted onchain', receipt);
          handleError(
            new Error('Withdrawal transaction reverted'),
            undefined,
            ERROR_STATES.CONTACT_INFO
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
      handleError(e, 'Error getting total deposits');
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
          _node
        );
      }
    }, 5_000);
    setListener(depositListener);
  };

  const stateReset = () => {
    setIniting(true);
    setTransferState(TRANSFER_STATES.LOADING);
    setErrorState(ERROR_STATES.RETRY);
    setIsError(false);
    setError(undefined);
    setDepositAddress(undefined);
    setActiveCrossChainTransferId(constants.HashZero);
    setScreen('Home');
    setActiveHeaderMessage(0);
    setActiveMessage(0);
    setAmount(BigNumber.from(0));
    setPreImage(undefined);
  };

  const handleClose = () => {
    clearInterval(listener!);
    onClose();
  };

  // TODO: when do you call modalInit without calling init
  const init = async () => {
    if (!showModal) {
      return;
    }

    stateReset();

    let _depositChainId: number;
    let _withdrawChainId: number;
    let _depositRpcProvider: providers.JsonRpcProvider;
    let _withdrawRpcProvider: providers.JsonRpcProvider;
    try {
      _withdrawChainId = await getChainId(withdrawChainProvider);
      _depositChainId = await getChainId(depositChainProvider);
      _depositRpcProvider = new providers.JsonRpcProvider(
        depositChainProvider,
        _depositChainId
      );
      _withdrawRpcProvider = new providers.JsonRpcProvider(
        withdrawChainProvider,
        _withdrawChainId
      );
      console.log(
        'deposit chain:',
        _depositChainId,
        'withdraw chain:',
        _withdrawChainId
      );
    } catch (e) {
      console.log(e);
      handleError(e, 'Error getting chain Id from provider');
      return;
    }

    setDepositChainId(_depositChainId);
    setWithdrawChainId(_withdrawChainId);
    setWithdrawRpcProvider(_withdrawRpcProvider);
    // setDepositRpcProvider(_depositRpcProvider);

    const _depositChainName = await getChainInfo(_depositChainId);
    setDepositChainName(_depositChainName);
    const _withdrawChainName = await getChainInfo(_withdrawChainId);
    setWithdrawChainName(_withdrawChainName);

    let _node: BrowserNode;
    try {
      // browser node object
      _node =
        node ??
        (await connectNode(
          routerPublicIdentifier,
          _depositChainId,
          _withdrawChainId,
          depositChainProvider,
          withdrawChainProvider
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

      handleError(e, 'Error initalizing Browser Node');
      return;
    }

    console.log('INITIALIZED BROWSER NODE');

    // get decimals for withdrawal asset
    const decimals = await getWithdrawAssetDecimals(
      _withdrawChainId,
      withdrawAssetId,
      _withdrawRpcProvider
    );
    setWithdrawAssetDecimals(decimals);

    // create evt containers
    const _evts = evts ?? createEvtContainer(_node);
    setEvts(_evts);

    setActiveMessage(1);
    let depositChannel: FullChannelState;
    try {
      depositChannel = await getChannelForChain(
        _node,
        routerPublicIdentifier,
        _depositChainId
      );
    } catch (e) {
      handleError(e, 'Could not get sender channel');
      return;
    }
    const _depositAddress = depositChannel!.channelAddress;
    setDepositAddress(_depositAddress);

    let withdrawChannel: FullChannelState;
    try {
      withdrawChannel = await getChannelForChain(
        _node,
        routerPublicIdentifier,
        _withdrawChainId
      );
    } catch (e) {
      handleError(e, 'Could not get receiver channel');
      return;
    }

    // callback for ready
    if (onReady) {
      onReady({
        depositChannelAddress: depositChannel.channelAddress,
        withdrawChannelAddress: withdrawChannel.channelAddress,
      });
    }

    // validate router before proceeding
    try {
      await verifyRouterSupportsTransfer(
        _node,
        _depositChainId,
        depositAssetId,
        _withdrawChainId,
        withdrawAssetId,
        _withdrawRpcProvider,
        routerPublicIdentifier,
        transferAmount
      );
    } catch (e) {
      handleError(e, 'Error in verifyRouterSupportsTransfer');
      return;
    }

    setActiveMessage(2);
    // prune any existing receiver transfers
    try {
      const hangingResolutions = await cancelHangingToTransfers(
        _node,
        _evts[EngineEvents.CONDITIONAL_TRANSFER_CREATED],
        _depositChainId,
        _withdrawChainId,
        withdrawAssetId,
        routerPublicIdentifier
      );
      console.log('hangingResolutions: ', hangingResolutions);
    } catch (e) {
      handleError(e, 'Error in cancelHangingToTransfers');
      return;
    }

    const [depositActive, withdrawActive] = await Promise.all([
      _node.getActiveTransfers({
        channelAddress: depositChannel.channelAddress,
      }),
      _node.getActiveTransfers({
        channelAddress: withdrawChannel.channelAddress,
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
        withdrawChannel.channelAddress,
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
      handleError(e, 'Error in waitForSenderCancels');
      return;
    }

    setActiveMessage(3);
    try {
      await reconcileDeposit(
        _node,
        depositChannel.channelAddress,
        depositAssetId
      );
    } catch (e) {
      handleError(e, 'Error in reconcileDeposit');
      return;
    }

    // After reconciling, get channel again
    try {
      depositChannel = await getChannelForChain(
        _node,
        routerPublicIdentifier,
        _depositChainId
      );
    } catch (e) {
      handleError(e, 'Could not get sender channel');
      return;
    }

    const offChainDepositAssetBalance = BigNumber.from(
      getBalanceForAssetId(depositChannel, depositAssetId, 'bob')
    );
    console.log(
      `Offchain balance for ${_depositAddress} of asset ${depositAssetId}: ${offChainDepositAssetBalance}`
    );

    const offChainWithdrawAssetBalance = BigNumber.from(
      getBalanceForAssetId(withdrawChannel, withdrawAssetId, 'bob')
    );
    console.log(
      `Offchain balance for ${withdrawChannel.channelAddress} of asset ${withdrawAssetId}: ${offChainWithdrawAssetBalance}`
    );

    if (
      offChainDepositAssetBalance.gt(0) &&
      offChainWithdrawAssetBalance.gt(0)
    ) {
      console.warn(
        'Balance exists in both channels, transferring first, then withdrawing'
      );
      await transfer(
        _depositChainId,
        _withdrawChainId,
        _depositAddress,
        _withdrawRpcProvider,
        offChainDepositAssetBalance,
        _evts,
        _node
      );
      return;
    }
    // if offChainDepositAssetBalance > 0
    if (offChainDepositAssetBalance.gt(0)) {
      // then start transfer
      await transfer(
        _depositChainId,
        _withdrawChainId,
        _depositAddress,
        _withdrawRpcProvider,
        offChainDepositAssetBalance,
        _evts,
        _node
      );
    }

    // if offchainWithdrawBalance > 0
    else if (offChainWithdrawAssetBalance.gt(0)) {
      // then go to withdraw screen with transfer amount == balance
      await withdraw(_withdrawChainId, _withdrawRpcProvider, _node);
    }

    // if both are zero, register listener and display
    // QR code
    else {
      // sets up deposit screen
      setTransferState(TRANSFER_STATES.INITIAL);
      console.log(`Starting block listener`);
      if (injectedProvider) {
        // using metamask, will be button-driven
        setIniting(false);
        return;
      }
      // display QR
      await depositListenerAndTransfer(
        _depositChainId,
        _withdrawChainId,
        _depositAddress,
        _depositRpcProvider,
        _withdrawRpcProvider,
        _evts,
        _node
      );
    }

    setIniting(false);
  };

  useEffect(() => {
    init();
  }, [showModal]);

  const headerMessage = (activeHeader: number) => {
    if (isError) {
      return <Typography variant="h6">Error!</Typography>;
    } else if (screen === 'Recover') {
      return <Typography variant="h6">Recovery</Typography>;
    } else {
      switch (activeHeader) {
        case 0:
          return (
            <>
              <Typography variant="h6">
                Send{' '}
                <Link
                  href={getExplorerLinkForAsset(
                    depositChainId!,
                    depositAssetId
                  )}
                  target="_blank"
                  onClick={preventDefault}
                >
                  {getAssetName(depositAssetId, depositChainId!)}
                </Link>
              </Typography>
            </>
          );

        case 1:
          return (
            <>
              <Typography variant="h6">
                Sending{' '}
                <Link
                  href={getExplorerLinkForAsset(
                    depositChainId!,
                    depositAssetId
                  )}
                  target="_blank"
                  onClick={preventDefault}
                >
                  {getAssetName(depositAssetId, depositChainId!)}
                </Link>
              </Typography>
            </>
          );

        case 2:
          return <Typography variant="h6">Success!</Typography>;

        default:
          return;
      }
    }
  };
  const steps = ['Deposit', 'Transfer', 'Withdraw'];

  function getScreen(step: number) {
    if (isError) {
      // ERROR SCREEN
      return (
        <>
          <ErrorScreen
            error={error ?? new Error('unknown')}
            errorState={errorState}
            crossChainTransferId={activeCrossChainTransferId}
            styles={classes.errorState}
            retry={init}
          />
        </>
      );
    } else {
      switch (step) {
        // LOADING SCREEN
        case -2:
          return (
            <>
              <Loading
                message={message(activeMessage)}
                initializing={initing}
              />
              {depositChainName && withdrawChainName && (
                <NetworkBar
                  depositChainName={depositChainName}
                  withdrawChainName={withdrawChainName}
                  styles={classes.networkBar}
                />
              )}
              <Grid container>
                <Grid item xs={12}>
                  <TextField
                    label={`Receiver Address on ${withdrawChainName}`}
                    defaultValue={withdrawalAddress}
                    InputProps={{
                      readOnly: true,
                    }}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </>
          );
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
                <Grid container justifyContent="center" alignContent="center">
                  <Grid item xs={12}>
                    <TextField
                      label={`Transfer Amount`}
                      defaultValue={transferAmount ?? ' 0'}
                      onChange={event =>
                        handleInjectedProviderTransferAmountEntry(
                          event.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      helperText={
                        !!amountError ? amountError : `From ${depositChainName}`
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      className={classes.success}
                      onClick={() => injectedProviderDeposit()}
                    >
                      Swap
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <div>
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
                          onClick={preventDefault}
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
                </div>
              )}

              <Footer styles={classes.footer} />
            </>
          );
        // STATUS SCREEEN
        case 0:
          return (
            <>
              <Grid container className={classes.status}>
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    Deposit detected on {depositChainName}...
                  </Typography>
                </Grid>
              </Grid>
              <Grid container justifyContent="center">
                <Alert severity="warning">
                  Please do not close or refresh this page
                </Alert>
              </Grid>
            </>
          );
        case 1:
          return (
            <>
              <Grid container className={classes.status}>
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    Transferring{' '}
                    {utils.formatUnits(amount, withdrawAssetDecimals)}{' '}
                    {getAssetName(depositAssetId, depositChainId!)} to{' '}
                    {withdrawChainName}...
                  </Typography>
                </Grid>
              </Grid>
              <Grid container justifyContent="center">
                <Alert severity="warning">
                  Please do not close or refresh this page
                </Alert>
              </Grid>
            </>
          );
        case 2:
          return (
            <>
              <Grid container className={classes.status}>
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    Withdrawing{' '}
                    {utils.formatUnits(amount, withdrawAssetDecimals)}{' '}
                    {getAssetName(withdrawAssetId, withdrawChainId!)} to{' '}
                    {withdrawChainName}...
                  </Typography>
                </Grid>
              </Grid>
              <Grid container justifyContent="center">
                <Alert severity="warning">
                  Please do not close or refresh this page
                </Alert>
              </Grid>
            </>
          );
        case 3:
          return (
            <>
              <Grid container className={classes.status}>
                <Grid item xs={12}>
                  <CompleteState
                    withdrawChainName={withdrawChainName!}
                    withdrawTx={withdrawTx!}
                    sentAmount={sentAmount!}
                    withdrawChainId={withdrawChainId!}
                    withdrawAssetId={withdrawAssetId}
                    withdrawAssetDecimals={withdrawAssetDecimals}
                    withdrawalAddress={withdrawalAddress}
                    styles={classes.completeState}
                    styleSuccess={classes.success}
                    onClose={handleClose}
                  />
                </Grid>
              </Grid>
              <Footer styles={classes.footer} />
            </>
          );
        default:
          return 'Unknown step';
      }
    }
  }

  function StepIcon(props: StepIconProps) {
    const { active, completed, error } = props;
    const icon: ReactElement = completed ? (
      <CheckCircle className={classes.success} />
    ) : active ? (
      error ? (
        <AlertCircle color="error" />
      ) : (
        <CircularProgress size="1rem" color="inherit" />
      )
    ) : (
      <Circle color="action" />
    );

    const icons: { [index: string]: ReactElement } = {
      1: icon,
      2: icon,
      3: icon,
    };

    return <>{icons[String(props.icon)]}</>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Dialog
        open={showModal}
        fullWidth={true}
        maxWidth="xs"
        className={classes.dialog}
      >
        <Card className={classes.card}>
          {activeStep != -2 && (
            <Grid
              id="Header"
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              className={classes.header}
            >
              <IconButton
                aria-label="close"
                disabled={[
                  TRANSFER_STATES.DEPOSITING,
                  TRANSFER_STATES.TRANSFERRING,
                  TRANSFER_STATES.WITHDRAWING,
                ].includes(transferState as any)}
                onClick={handleClose}
              >
                <X />
              </IconButton>

              {headerMessage(activeHeaderMessage)}

              <Grid>
                <FeedbackFish projectId="aba3b7b0fe6009">
                  <IconButton aria-label="feedback">
                    <Send />
                  </IconButton>
                </FeedbackFish>
                <Options
                  setScreen={setScreen}
                  activeScreen={screen}
                  transferState={transferState}
                />
              </Grid>
            </Grid>
          )}
          {screen === 'Home' && (
            <>
              <Grid container id="body" className={classes.body}>
                <>
                  {activeStep > -1 && (
                    <Grid container className={classes.steps}>
                      <Grid item xs={12}>
                        <Stepper activeStep={activeStep}>
                          {steps.map(label => {
                            return (
                              <Step key={label}>
                                <StepLabel
                                  StepIconComponent={StepIcon}
                                  StepIconProps={{ error: isError }}
                                >
                                  {label}
                                </StepLabel>
                              </Step>
                            );
                          })}
                        </Stepper>
                      </Grid>
                    </Grid>
                  )}

                  {getScreen(activeStep)}
                </>
              </Grid>
            </>
          )}
          {screen === 'Recover' && (
            <>
              <Recover
                node={node!}
                depositAddress={depositAddress}
                depositChainId={depositChainId!}
              />
              <Footer styles={classes.footer} />
            </>
          )}
        </Card>
      </Dialog>
    </ThemeProvider>
  );
};

interface FooterProps {
  styles: string;
}

const Footer: FC<FooterProps> = props => {
  const { styles } = props;
  const preventDefault = (event: React.SyntheticEvent) =>
    event.preventDefault();
  return (
    <Grid
      id="Footer"
      className={styles}
      container
      direction="row"
      justifyContent="center"
    >
      <Typography variant="overline">
        <Link
          href="https://connext.network"
          target="_blank"
          onClick={preventDefault}
        >
          Powered By Connext
        </Link>
      </Typography>
    </Grid>
  );
};

export interface EthereumAddressProps {
  depositChainName: string;
  depositAddress: string;
  styles: string;
}

const EthereumAddress: FC<EthereumAddressProps> = props => {
  const { depositAddress, styles } = props;
  const [copiedDepositAddress, setCopiedDepositAddress] = useState<boolean>(
    false
  );
  return (
    <>
      <Grid container alignItems="flex-end" className={styles}>
        <Grid item xs={12}>
          <TextField
            label={`Deposit Address on ${props.depositChainName}`}
            defaultValue={depositAddress}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      console.log(`Copying: ${depositAddress}`);
                      navigator.clipboard.writeText(depositAddress);
                      setCopiedDepositAddress(true);
                      setTimeout(() => setCopiedDepositAddress(false), 5000);
                    }}
                    edge="end"
                  >
                    {!copiedDepositAddress ? <Copy /> : <Check />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        </Grid>
      </Grid>
    </>
  );
};
export interface NetworkBarProps {
  depositChainName: string;
  withdrawChainName: string;
  styles: string;
}

const NetworkBar: FC<NetworkBarProps> = ({
  depositChainName,
  withdrawChainName,
  styles,
}) => {
  return (
    <>
      <Grid
        id="network"
        container
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        className={styles}
      >
        <Grid item>
          <Chip color="primary" label={depositChainName} />
        </Grid>
        <ChevronsRight />
        <Grid item>
          <Chip color="secondary" label={withdrawChainName} />
        </Grid>
      </Grid>
    </>
  );
};

export interface CompleteStateProps {
  withdrawTx: string;
  withdrawChainName: string;
  withdrawAssetId: string;
  withdrawChainId: number;
  withdrawAssetDecimals: number;
  withdrawalAddress: string;
  sentAmount: string;
  styles: string;
  styleSuccess: string;
  onClose: () => void;
}

const CompleteState: FC<CompleteStateProps> = ({
  withdrawTx,
  withdrawChainName,
  sentAmount,
  withdrawAssetId,
  withdrawChainId,
  withdrawAssetDecimals,
  withdrawalAddress,
  styles,
  styleSuccess,
  onClose,
}) => {
  const preventDefault = (event: React.SyntheticEvent) =>
    event.preventDefault();
  return (
    <>
      <Grid container className={styles} alignItems="center" direction="column">
        <CheckCircle className={styleSuccess} fontSize="large" />
        <Typography gutterBottom variant="h6">
          Successfully sent{' '}
          {utils.formatUnits(sentAmount, withdrawAssetDecimals)}{' '}
          <Link
            href={getExplorerLinkForAsset(withdrawChainId, withdrawAssetId)}
            target="_blank"
            onClick={preventDefault}
          >
            {getAssetName(withdrawAssetId, withdrawChainId)}!
          </Link>
        </Typography>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TextField
            label={`Receiver Address on ${withdrawChainName}`}
            defaultValue={withdrawalAddress}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <Grid container justifyContent="center">
            <Button
              variant="outlined"
              className={styleSuccess}
              href={getExplorerLinkForTx(withdrawChainId, withdrawTx)}
              target="_blank"
            >
              Transaction Receipt
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container justifyContent="center">
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export interface ErrorStateProps {
  error: Error;
  errorState: ErrorStates;
  crossChainTransferId: string;
  styles: string;
  retry: () => void;
}

const ErrorScreen: FC<ErrorStateProps> = ({
  error,
  errorState,
  crossChainTransferId,
  styles,
  retry,
}) => {
  const cancelled = error.message.includes('Transfer was cancelled');
  return (
    <>
      <Grid container className={styles} alignItems="center" direction="column">
        <AlertCircle fontSize="large" color={cancelled ? `primary` : `error`} />
        <Typography
          gutterBottom
          variant="caption"
          color={cancelled ? `primary` : `error`}
        >
          {cancelled ? 'Alert' : 'Error'}
        </Typography>

        <Typography
          gutterBottom
          variant="caption"
          color={cancelled ? `primary` : `error`}
          align="center"
        >
          {cancelled
            ? `The transfer could not complete, likely because of a communication issue. Funds are preserved in the state channel. Refreshing usually works in this scenario.`
            : `${
                crossChainTransferId !== constants.HashZero
                  ? `${crossChainTransferId.substring(0, 10)}... - `
                  : ''
              }${error.message}`}
        </Typography>
      </Grid>

      {errorState === ERROR_STATES.REFRESH && (
        <Grid container direction="row" justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => {
              window.location.reload();
            }}
          >
            Refresh
          </Button>
        </Grid>
      )}

      {errorState === ERROR_STATES.CONTACT_INFO && (
        <>
          <Typography
            gutterBottom
            variant="caption"
            color="primary"
            align="center"
          >
            Uh oh, looks like you got an unexpected error. Please try to
            refresh, or if that doesn't work, contact us on Discord for more
            support
          </Typography>

          <Grid container direction="row" justifyContent="center">
            <Button
              variant="outlined"
              id="link"
              onClick={() =>
                window.open(
                  'https://discord.com/channels/454734546869551114',
                  '_blank'
                )
              }
            >
              Discord
            </Button>
          </Grid>
        </>
      )}

      {errorState === ERROR_STATES.RETRY && (
        <>
          <Grid container direction="row" justifyContent="center">
            <Button variant="outlined" onClick={retry}>
              Retry
            </Button>
          </Grid>
        </>
      )}
    </>
  );
};

export default ConnextModal;
