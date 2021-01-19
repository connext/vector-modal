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
} from '@material-ui/core';
import {
  FileCopy,
  Check,
  Close,
  DoubleArrow,
  CheckCircleRounded,
  FiberManualRecordOutlined,
  ErrorRounded,
  CheckCircleTwoTone,
} from '@material-ui/icons';
import {
  makeStyles,
  createStyles,
  Theme,
  createMuiTheme,
} from '@material-ui/core/styles';
import { purple, blue, green } from '@material-ui/core/colors';
// @ts-ignore
import QRCode from 'qrcode.react';
import { BigNumber, constants, Contract, utils } from 'ethers';
import {
  EngineEvents,
  ERC20Abi,
  FullChannelState,
} from '@connext/vector-types';
import { getBalanceForAssetId, getRandomBytes32 } from '@connext/vector-utils';
import {
  CHAIN_INFO_URL,
  getAssetName,
  TransferStates,
  TRANSFER_STATES,
  Screens,
  message,
} from '../constants';
import { connext } from '../service';
import {
  getExplorerLinkForTx,
  activePhase,
  hydrateProviders,
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
} from '../utils';
import Loading from './Loading';
import Options from './Options';
import Recover from './Recover';

const theme = createMuiTheme({
  palette: {
    mode: 'light',
    primary: {
      main: purple[500],
    },
    secondary: {
      main: blue[500],
    },
    success: {
      main: green[500],
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  spacing: 2,
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    spacing: {
      margin: theme.spacing(3, 2),
    },
    card: {
      height: 'auto',
      minWidth: '390px',
    },
    success: { color: green[500] },
    dialog: {},
    header: {},
    networkBar: { paddingBottom: '1.5rem' },
    body: { padding: '1rem' },
    steps: { paddingBottom: '1rem' },
    status: { paddingBottom: '1rem' },
    qrcode: {
      paddingBottom: '1rem',
      filter: 'drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.25))',
      borderRadius: '5px',
    },
    ethereumAddress: { paddingBottom: '1rem' },
    completeState: { paddingBottom: '1rem' },
    errorState: { paddingBottom: '1rem' },
    footer: {},
  })
);

export type ConnextModalProps = {
  showModal: boolean;
  routerPublicIdentifier: string;
  depositChainId: number;
  depositChainProvider: string;
  depositAssetId: string;
  withdrawChainId: number;
  withdrawChainProvider: string;
  withdrawAssetId: string;
  withdrawalAddress: string;
  onClose: () => void;
  onReady?: (params: {
    depositChannelAddress: string;
    withdrawChannelAddress: string;
  }) => any;
  connextNode?: BrowserNode;
  transferAmount?: string;
};

const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  routerPublicIdentifier,
  depositChainId,
  depositChainProvider,
  depositAssetId,
  withdrawChainId,
  withdrawChainProvider,
  withdrawAssetId,
  withdrawalAddress,
  onClose,
  onReady,
  connextNode,
  transferAmount,
}) => {
  const classes = useStyles();
  const [depositAddress, setDepositAddress] = useState<string>();
  const [depositChainName, setDepositChainName] = useState<string>(
    depositChainId.toString()
  );
  const [withdrawChainName, setWithdrawChainName] = useState<string>(
    withdrawChainId.toString()
  );
  const [withdrawAssetDecimals, setWithdrawAssetDecimals] = useState(18);
  const [sentAmount, setSentAmount] = useState<string>('0');
  const [evts, setEvts] = useState<EvtContainer>();

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [initing, setIniting] = useState<boolean>(true);

  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error>();

  const [activeCrossChainTransferId, _setActiveCrossChainTransferId] = useState<
    string
  >(constants.HashZero);
  const activeCrossChainTransferIdRef = React.useRef(
    activeCrossChainTransferId
  );
  const setActiveCrossChainTransferId = (data: string) => {
    activeCrossChainTransferIdRef.current = data;
    _setActiveCrossChainTransferId(data);
  };
  const [preImage, _setPreImage] = useState<string>();
  const preImageRef = React.useRef(preImage);
  const setPreImage = (data: string | undefined) => {
    preImageRef.current = data;
    _setPreImage(data);
  };

  const [screen, setScreen] = useState<Screens>('Home');

  const [listener, setListener] = useState<NodeJS.Timeout>();

  const [transferState, setTransferState] = useState<TransferStates>(
    TRANSFER_STATES.INITIAL
  );

  const activeStep = activePhase(transferState);

  const _ethProviders = hydrateProviders(
    depositChainId,
    depositChainProvider,
    withdrawChainId,
    withdrawChainProvider
  );

  const [activeMessage, setActiveMessage] = useState(0);
  const [activeHeaderMessage, setActiveHeaderMessage] = useState(0);

  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));

  const handleError = (e: Error | undefined, message?: string) => {
    if (message) {
      console.error(message, e);
    }
    setError(e);
    setIsError(true);
    setIniting(false);
    setPreImage(undefined);
  };

  const getChainInfo = async () => {
    try {
      const chainInfo: any[] = await utils.fetchJson(CHAIN_INFO_URL);
      const depositChainInfo = chainInfo.find(
        info => info.chainId === depositChainId
      );
      if (depositChainInfo) {
        setDepositChainName(depositChainInfo.name);
      }

      const withdrawChainInfo = chainInfo.find(
        info => info.chainId === withdrawChainId
      );
      if (withdrawChainInfo) {
        setWithdrawChainName(withdrawChainInfo.name);
      }
    } catch (e) {
      console.warn(`Could not fetch chain info from ${CHAIN_INFO_URL}`);
    }
  };

  const getWithdrawAssetDecimals = async () => {
    const token = new Contract(
      withdrawAssetId,
      ERC20Abi,
      _ethProviders[withdrawChainId]
    );

    if (withdrawAssetId !== constants.AddressZero) {
      try {
        const supply = await token.totalSupply();
        console.log('supply: ', supply);
        const decimals = await token.decimals();
        console.log(
          `Detected token decimals for withdrawChainId ${withdrawChainId}: `,
          decimals
        );
        setWithdrawAssetDecimals(decimals);
      } catch (e) {
        console.error(
          `Error detecting decimals, unsafely falling back to 18 decimals for withdrawChainId ${withdrawChainId}: `,
          e
        );
      }
    } else {
      console.log(
        `Using native asset 18 decimals for withdrawChainId ${withdrawChainId}`
      );
    }
  };

  const cancelTransfer = async (
    depositChannelAddress: string,
    withdrawChannelAddress: string,
    transferId: string,
    crossChainTransferId: string,
    _evts: EvtContainer
  ) => {
    // show a better screen here, loading UI
    handleError(new Error('Cancelling transfer'));

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
      await cancelToAssetTransfer(
        connext.connextClient!,
        withdrawChannelAddress,
        transferId
      );
    } catch (e) {
      handleError(e, 'Error in cancelToAssetTransfer');
    }

    try {
      await Promise.all([senderResolution, receiverResolution]);
      handleError(new Error('Transfer cancelled'));
    } catch (e) {
      handleError(e, 'Error waiting for sender and receiver cancellations');
    }
  };

  const transfer = async (
    _depositAddress: string,
    transferAmount: BigNumber,
    _evts: EvtContainer
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
      await reconcileDeposit(
        connext.connextClient!,
        _depositAddress,
        depositAssetId
      );
    } catch (e) {
      handleError(e, 'Error in reconcileDeposit');
      return;
    }
    // call createFromAssetTransfer

    setTransferState(TRANSFER_STATES.TRANSFERRING);

    let preImageVar;
    try {
      console.log(
        `Calling createFromAssetTransfer ${depositChainId} ${depositAssetId} ${withdrawChainId} ${withdrawAssetId} ${crossChainTransferId}`
      );
      const preImage = getRandomBytes32();
      await createFromAssetTransfer(
        connext.connextClient!,
        depositChainId,
        depositAssetId,
        withdrawChainId,
        withdrawAssetId,
        routerPublicIdentifier,
        crossChainTransferId,
        preImage
      );
      preImageVar = preImage;
    } catch (e) {
      handleError(e, 'Error in createFromAssetTransfer');
      return;
    }
    setPreImage(preImageVar);
    console.log('setPreImage(preImageVar);: ', preImageVar);

    // wait a long time for this, it needs to send onchain txs
    try {
      await _evts[EngineEvents.CONDITIONAL_TRANSFER_CREATED]
        .pipe(data => {
          return (
            data.transfer.meta?.routingId === crossChainTransferId &&
            data.transfer.initiatorIdentifier === routerPublicIdentifier
          );
        })
        .waitFor(300_000);
    } catch (e) {
      handleError(
        e,
        'Did not see CONDITIONAL_TRANSFER_CREATED after 300 seconds'
      );
      return;
    }

    // once createFromAssetTransfer resolves, then you should
    // go to in progress screen

    // get promises

    // okay to move forward if this rejects

    // cannot move forward until this resolves
    const receiverResolve = _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]
      .pipe(data => {
        return (
          data.transfer.meta?.routingId === crossChainTransferId &&
          data.transfer.initiatorIdentifier === routerPublicIdentifier
        );
      })
      .waitFor(45_000);

    const senderCancel = _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]
      .pipe(data => {
        return (
          data.transfer.meta?.routingId === crossChainTransferId &&
          data.transfer.responderIdentifier === routerPublicIdentifier &&
          Object.values(data.transfer.transferResolver)[0] ===
            constants.HashZero
        );
      })
      .waitFor(45_000);

    // If the sender cancel happened before the receiver resolve, show
    // refresh screen (maybe do this on a callback in event instead of doing
    // what i just did above)

    const senderResolve = _evts[EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]
      .pipe(data => {
        return (
          data.transfer.meta?.routingId === crossChainTransferId &&
          data.transfer.responderIdentifier === routerPublicIdentifier
        );
      })
      .waitFor(45_000);

    await resolveToAssetTransfer(
      connext.connextClient!,
      withdrawChainId,
      preImageVar,
      crossChainTransferId,
      routerPublicIdentifier
    );
    try {
      const receiverResolvedData = await Promise.race([
        receiverResolve,
        senderCancel,
      ]);
      if (
        Object.values(
          receiverResolvedData.transfer.transferResolver ?? {}
        )[0] === constants.HashZero
      ) {
        console.log('Transfer was cancelled');
        // TODO: SHOW CANCELLATION SCREEN
        handleError(new Error('Transfer was cancelled'));
        return;
      }
    } catch (e) {
      handleError(
        e,
        'Did not receive the receiver transfer resolution after 45 seconds'
      );
      return;
    }
    setPreImage(undefined);

    try {
      await senderResolve;
    } catch (e) {
      console.warn(
        'Did not find reclaim event from router, proceeding with withdrawal',
        e
      );
    }

    await withdraw();
  };

  const withdraw = async () => {
    setTransferState(TRANSFER_STATES.WITHDRAWING);

    // now go to withdrawal screen
    let result;
    try {
      result = await withdrawToAsset(
        connext.connextClient!,
        withdrawChainId,
        withdrawAssetId,
        withdrawalAddress,
        routerPublicIdentifier
      );
    } catch (e) {
      handleError(e, 'Error in crossChainTransfer');
      setActiveHeaderMessage(3);
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
    _ethProviders[withdrawChainId]
      .waitForTransaction(result.withdrawalTx)
      .then(receipt => {
        if (receipt.status === 0) {
          // tx reverted
          // TODO: go to contact screen
          console.error('Transaction reverted onchain', receipt);
          handleError(new Error('Withdrawal transaction reverted'));
          setActiveHeaderMessage(3);
          return;
        }
      });
  };

  const depositListenerAndTransfer = async (
    _depositAddress: string,
    _evts: EvtContainer
  ) => {
    let initialDeposits: BigNumber;
    try {
      initialDeposits = await getTotalDepositsBob(
        _depositAddress,
        depositAssetId,
        _ethProviders[depositChainId]
      );
    } catch (e) {
      handleError(e, 'Error getting total deposits');
      return;
    }
    console.log(
      `Starting balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${initialDeposits.toString()}`
    );

    let depositListener = setInterval(async () => {
      let updatedDeposits: BigNumber;
      try {
        updatedDeposits = await getTotalDepositsBob(
          _depositAddress,
          depositAssetId,
          _ethProviders[depositChainId]
        );
      } catch (e) {
        console.warn(`Error fetching balance: ${e.message}`);
        return;
      }
      console.log(
        `Updated balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${updatedDeposits.toString()}`
      );

      if (updatedDeposits.lt(initialDeposits)) {
        initialDeposits = updatedDeposits;
      }

      if (updatedDeposits.gt(initialDeposits)) {
        clearInterval(depositListener!);
        const transferAmount = updatedDeposits.sub(initialDeposits);
        initialDeposits = updatedDeposits;
        await transfer(_depositAddress, transferAmount, _evts);
      }
    }, 5_000);
    setListener(depositListener);
  };

  const stateReset = () => {
    setIniting(true);
    setTransferState(TRANSFER_STATES.INITIAL);
    setIsError(false);
    setError(undefined);
    setDepositAddress(undefined);
    setActiveCrossChainTransferId(constants.HashZero);
    setScreen('Home');
    setActiveHeaderMessage(0);
    setAmount(BigNumber.from(0));
    setPreImage(undefined);
  };

  const handleClose = () => {
    clearInterval(listener!);
    onClose();
  };

  useEffect(() => {
    const init = async () => {
      if (!showModal) {
        return;
      }
      setActiveMessage(0);
      stateReset();
      await getChainInfo();

      try {
        // browser node object
        await connext.connectNode(
          connextNode,
          routerPublicIdentifier,
          depositChainId,
          withdrawChainId,
          depositChainProvider,
          withdrawChainProvider
        );
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
      await getWithdrawAssetDecimals();

      // create evt containers
      let _evts = evts;
      if (!_evts) {
        _evts = createEvtContainer(connext.connextClient!);
      }

      setActiveMessage(1);
      let depositChannel: FullChannelState;
      try {
        depositChannel = await getChannelForChain(
          connext.connextClient!,
          routerPublicIdentifier,
          depositChainId
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
          connext.connextClient!,
          routerPublicIdentifier,
          withdrawChainId
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
      setEvts(_evts);

      // validate router before proceeding
      try {
        await verifyRouterSupportsTransfer(
          connext.connextClient!,
          depositChainId,
          depositAssetId,
          withdrawChainId,
          withdrawAssetId,
          _ethProviders[withdrawChainId],
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
          connext.connextClient!,
          _evts[EngineEvents.CONDITIONAL_TRANSFER_CREATED],
          depositChainId,
          withdrawChainId,
          withdrawAssetId,
          routerPublicIdentifier
        );
        console.log('hangingResolutions: ', hangingResolutions);
      } catch (e) {
        handleError(e, 'Error in cancelHangingToTransfers');
        return;
      }

      const [depositActive, withdrawActive] = await Promise.all([
        connext.connextClient!.getActiveTransfers({
          channelAddress: depositChannel.channelAddress,
        }),
        connext.connextClient!.getActiveTransfers({
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
        console.log('crosschain: ', activeCrossChainTransferIdRef.current);
        console.log('CONDITIONAL_TRANSFER_CREATED >>>>>>>>> data: ', data);
        return (
          data.transfer.responderIdentifier ===
            connext.connextClient?.publicIdentifier &&
          data.transfer.meta.routingId !== activeCrossChainTransferIdRef.current
        );
      }).attach(async data => {
        console.warn('cancelling transfer thats not active');
        await cancelTransfer(
          _depositAddress,
          withdrawChannel.channelAddress,
          data.transfer.transferId,
          data.transfer.meta.crossChainTransferId,
          _evts!
        );
      });

      try {
        console.log('waiting for sender cancellations..');
        await waitForSenderCancels(
          connext.connextClient!,
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
          connext.connextClient!,
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
          connext.connextClient!,
          routerPublicIdentifier,
          depositChainId
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
        await transfer(_depositAddress, offChainDepositAssetBalance, _evts);
        return;
      }

      // if offChainDepositAssetBalance > 0
      if (offChainDepositAssetBalance.gt(0)) {
        // then start transfer
        await transfer(_depositAddress, offChainDepositAssetBalance, _evts);
      }

      // if offchainWithdrawBalance > 0
      else if (offChainWithdrawAssetBalance.gt(0)) {
        // then go to withdraw screen with transfer amount == balance
        await withdraw();
      }

      // if both are zero, register listener and display
      // QR code
      else {
        console.log(`Starting block listener`);
        await depositListenerAndTransfer(_depositAddress, _evts);
      }

      setIniting(false);
    };
    init();
  }, [showModal]);

  const headerMessage = (activeHeader: number) => {
    switch (activeHeader) {
      case 0:
        return (
          <>
            <Typography variant="h6">
              Send{' '}
              <a
                href={getExplorerLinkForAsset(depositChainId, depositAssetId)}
                target="_blank"
              >
                {getAssetName(depositAssetId, depositChainId)}
              </a>
            </Typography>
          </>
        );

      case 1:
        return (
          <>
            <Typography variant="h6">
              Sending{' '}
              <a
                href={getExplorerLinkForAsset(depositChainId, depositAssetId)}
                target="_blank"
              >
                {getAssetName(depositAssetId, depositChainId)}
              </a>
            </Typography>
          </>
        );

      case 2:
        return <Typography variant="h6">Success!</Typography>;

      case 3:
        return <Typography variant="h6">Error!</Typography>;

      default:
        return;
    }
  };
  const steps = ['Deposit', 'Transfer', 'Withdraw'];

  function getStepContent(step: number) {
    if (isError) {
      return (
        <>
          <ErrorState
            error={error ?? new Error('unknown')}
            crossChainTransferId={activeCrossChainTransferId}
            styles={classes.errorState}
          />
        </>
      );
    } else {
      switch (step) {
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
                <Alert severity="error">
                  Do not use this component in Incognito Mode{' '}
                </Alert>
              </Grid>
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
              <EthereumAddress
                depositChainName={depositChainName}
                depositAddress={depositAddress!}
                styles={classes.ethereumAddress}
              />
              <Footer styles={classes.footer} />
            </>
          );
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
                    {getAssetName(depositAssetId, depositChainId)} to{' '}
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
                    {getAssetName(withdrawAssetId, withdrawChainId)} to{' '}
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
                    withdrawChainName={withdrawChainName}
                    withdrawTx={withdrawTx!}
                    sentAmount={sentAmount!}
                    withdrawChainId={withdrawChainId}
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
      <CheckCircleRounded className={classes.success} />
    ) : active ? (
      error ? (
        <ErrorRounded color="error" />
      ) : (
        <CircularProgress size="1rem" color="inherit" />
      )
    ) : (
      <FiberManualRecordOutlined color="action" />
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
          {depositAddress && (
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
                edge="start"
                onClick={handleClose}
              >
                <Close />
              </IconButton>

              {headerMessage(activeHeaderMessage)}

              <Options setScreen={setScreen} activeScreen={screen} />
            </Grid>
          )}
          {screen === 'Home' && (
            <>
              <Grid container id="body" className={classes.body}>
                {depositAddress ? (
                  <>
                    {activeStep != -1 && (
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

                    {getStepContent(activeStep)}
                  </>
                ) : (
                  <>
                    {isError ? (
                      <>
                        <ErrorState
                          error={error ?? new Error('unknown')}
                          crossChainTransferId={activeCrossChainTransferId}
                          styles={classes.errorState}
                        />
                      </>
                    ) : (
                      <>
                        <Loading
                          message={message(activeMessage)}
                          initializing={initing}
                        />
                        <NetworkBar
                          depositChainName={depositChainName}
                          withdrawChainName={withdrawChainName}
                          styles={classes.networkBar}
                        />
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
                    )}
                  </>
                )}
              </Grid>
            </>
          )}

          {screen === 'Recover' && (
            <>
              <Recover
                depositAddress={depositAddress}
                depositChainId={depositChainId}
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
  return (
    <Grid
      id="Footer"
      className={styles}
      container
      direction="row"
      justifyContent="center"
    >
      <Typography variant="overline">
        <a href="https://connext.network" target="_blank">
          Powered By Connext
        </a>
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
                    {!copiedDepositAddress ? <FileCopy /> : <Check />}
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
        <DoubleArrow />
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
}) => (
  <>
    <Grid container className={styles} alignItems="center" direction="column">
      <CheckCircleTwoTone className={styleSuccess} fontSize="large" />
      <Typography gutterBottom variant="h6">
        Successfully sent {utils.formatUnits(sentAmount, withdrawAssetDecimals)}{' '}
        <a
          href={getExplorerLinkForAsset(withdrawChainId, withdrawAssetId)}
          target="_blank"
        >
          {getAssetName(withdrawAssetId, withdrawChainId)}
        </a>
        !
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
          <Button
            variant="contained"
            className={styleSuccess}
            onClick={onClose}
          >
            Close Modal
          </Button>
        </Grid>
      </Grid>
    </Grid>
  </>
);

export interface ErrorStateProps {
  error: Error;
  crossChainTransferId: string;
  styles: string;
}

const ErrorState: FC<ErrorStateProps> = ({
  error,
  crossChainTransferId,
  styles,
}) => {
  const cancelled = error.message.includes('Transfer was cancelled');
  return (
    <>
      <Grid container className={styles} alignItems="center" direction="column">
        <ErrorRounded
          fontSize="large"
          color={cancelled ? `primary` : `error`}
        />
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
    </>
  );
};

export default ConnextModal;
