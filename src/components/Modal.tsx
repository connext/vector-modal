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
  Tooltip,
  withStyles,
  StepIconProps,
  Alert,
} from '@material-ui/core';
import {
  FileCopy,
  Check,
  Close,
  DoubleArrow,
  Brightness4,
  WbSunny,
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
import { purple, blue } from '@material-ui/core/colors';
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
} from '../constants';
import { connext } from '../service';
import {
  getExplorerLinkForTx,
  activePhase,
  getAssetBalance,
  hydrateProviders,
  getExplorerLinkForAsset,
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

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [crossChainTransfers, setCrossChainTransfers] = useState<{
    [crossChainTransferId: string]: TransferStates;
  }>({});

  const [initing, setIniting] = useState<boolean>(true);

  const [activeStep, setActiveStep] = useState(-1);

  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error>();

  const [activeCrossChainTransferId, setActiveCrossChainTransferId] = useState<
    string
  >(constants.HashZero);

  const [screen, setScreen] = useState<Screens>('Home');

  const [vectorListenersStarted, setVectorListenersStarted] = useState(false);
  const [listener, setListener] = useState<ReturnType<typeof setInterval>>();

  const transferState: TransferStates =
    crossChainTransfers[activeCrossChainTransferId] ?? TRANSFER_STATES.INITIAL;

  const _ethProviders = hydrateProviders(
    depositChainId,
    depositChainProvider,
    withdrawChainId,
    withdrawChainProvider
  );

  const [activeTip, setActiveTip] = useState(0);
  const [activeMessage, setActiveMessage] = useState(0);
  const [activeHeaderMessage, setActiveHeaderMessage] = useState(0);

  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));
  const tips = () => {
    switch (activeTip) {
      case 0:
        return 'Please do not close or refresh window while transfer in progress!';

      case 1:
        return `Send only ${getAssetName(
          depositAssetId,
          depositChainId
        )} to the above Deposit Address.`;

      default:
        setActiveTip(0);
        return 'Please do not close or refresh window while transfer in progress!';
    }
  };

  const message = () => {
    switch (activeMessage) {
      case 0:
        return 'Connecting to Network...';

      case 1:
        return `Setting Up Deposit Address...`;

      case 2:
        return `Looking for existing Channel Balance...`;

      default:
        setActiveMessage(0);
        return 'Connecting to Network...';
    }
  };

  const headerMessage = () => {
    switch (activeHeaderMessage) {
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
        setActiveHeaderMessage(0);
        return;
    }
  };

  const setTips = () => {
    setActiveTip(activeTip + 1);
  };

  const registerEngineEventListeners = (
    node: BrowserNode,
    startingBalance: BigNumber
  ): void => {
    console.log('Starting Vector listeners');
    node.on(EngineEvents.DEPOSIT_RECONCILED, data => {
      console.log('EngineEvents.DEPOSIT_RECONCILED: ', data);
      if (
        startingBalance.lt(data.channelBalance.amount[1]) && // deposit actually added balance
        data.channelAddress === depositAddress // depositAddress is channelAddress on deposit chain
      ) {
        // if (data.meta.crossChainTransferId) {
        setCrossChainTransferWithErrorTimeout(
          activeCrossChainTransferId,
          TRANSFER_STATES.DEPOSITING
        );
      }
      // }
    });
    node.on(EngineEvents.CONDITIONAL_TRANSFER_CREATED, data => {
      console.log('EngineEvents.CONDITIONAL_TRANSFER_CREATED: ', data);
      if (
        data.transfer.meta.crossChainTransferId &&
        data.transfer.initiator === node.signerAddress
      ) {
        // if (data.meta.crossChainTransferId) {
        setCrossChainTransferWithErrorTimeout(
          data.transfer.meta.crossChainTransferId,
          TRANSFER_STATES.TRANSFERRING
        );
      }
      // }
    });
    node.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, data => {
      console.log('EngineEvents.CONDITIONAL_TRANSFER_RESOLVED: ', data);
      if (
        data.transfer.meta.crossChainTransferId &&
        data.transfer.initiator === node.signerAddress
      ) {
        setCrossChainTransferWithErrorTimeout(
          data.transfer.meta.crossChainTransferId,
          TRANSFER_STATES.WITHDRAWING
        );
      }
    });
    node.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, data => {
      console.log('EngineEvents.CONDITIONAL_TRANSFER_RESOLVED: ', data);
      if (
        data.transfer.meta.crossChainTransferId &&
        Object.values(data.transfer.transferResolver)[0] ===
          constants.HashZero &&
        data.transfer.chainId === depositChainId
      ) {
        let tracked = { ...crossChainTransfers };
        tracked[data.transfer.meta.crossChainTransferId] =
          TRANSFER_STATES.ERROR;
        setCrossChainTransfers(tracked);
        setIsError(true);
        setError(
          new Error(
            `Transfer was cancelled, funds are preserved in the state channel, please refresh and try again`
          )
        );
      }
    });
    node.on(EngineEvents.WITHDRAWAL_RESOLVED, data => {
      console.log('EngineEvents.WITHDRAWAL_RESOLVED: ', data);
      if (
        data.transfer.meta.crossChainTransferId &&
        data.transfer.initiator === node.signerAddress
      ) {
        setCrossChainTransferWithErrorTimeout(
          data.transfer.meta.crossChainTransferId,
          TRANSFER_STATES.COMPLETE
        );
      }
    });
  };

  const setCrossChainTransferWithErrorTimeout = (
    crossChainTransferId: string,
    phase: TransferStates
  ) => {
    let tracked = { ...crossChainTransfers };
    tracked[crossChainTransferId] = phase;
    setCrossChainTransfers(tracked);
    setActiveStep(activePhase(phase));
    setIsError(false);
    setTimeout(() => {
      if (crossChainTransfers[crossChainTransferId] !== phase) {
        return;
      }
      // Error if not updated
      let tracked = { ...crossChainTransfers };
      tracked[crossChainTransferId] = TRANSFER_STATES.ERROR;
      setCrossChainTransfers(tracked);
      setIsError(true);
      setError(new Error(`No updates within 30s for ${crossChainTransferId}`));
    }, 30_000);
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

  const transfer = async (
    _depositAddress: string,
    transferAmount: BigNumber
  ) => {
    setActiveHeaderMessage(1);
    if (!vectorListenersStarted) {
      registerEngineEventListeners(connext.connextClient!, transferAmount);
      setVectorListenersStarted(true);
    } else {
      console.log('Vector listeners already running');
    }
    const crossChainTransferId = getRandomBytes32();
    setActiveCrossChainTransferId(crossChainTransferId);
    const updated = { ...crossChainTransfers };
    updated[crossChainTransferId] = TRANSFER_STATES.DEPOSITING;
    setCrossChainTransfers(updated);
    setActiveStep(activePhase(TRANSFER_STATES.DEPOSITING));
    setIsError(false);
    setAmount(transferAmount);
    try {
      const result = await connext.connextClient!.crossChainTransfer({
        amount: transferAmount.toString(),
        fromAssetId: depositAssetId,
        fromChainId: depositChainId,
        toAssetId: withdrawAssetId,
        toChainId: withdrawChainId,
        reconcileDeposit: true,
        withdrawalAddress,
        crossChainTransferId,
      });
      console.log('crossChainTransfer: ', result);
      setWithdrawTx(result.withdrawalTx);
      setSentAmount(result.withdrawalAmount ?? '0');
      setActiveStep(activePhase(TRANSFER_STATES.COMPLETE));
      setIsError(false);
      setActiveHeaderMessage(2);
      updated[crossChainTransferId] = TRANSFER_STATES.COMPLETE;
      setCrossChainTransfers(updated);
    } catch (e) {
      setError(e);
      console.error('Error in crossChainTransfer: ', e);
      const updated = { ...crossChainTransfers };
      updated[crossChainTransferId] = TRANSFER_STATES.ERROR;
      setIsError(true);
      setActiveHeaderMessage(3);
      setCrossChainTransfers(updated);
    }
  };

  const blockListenerAndTransfer = async (_depositAddress: string) => {
    let initialBalance: BigNumber;
    try {
      initialBalance = await getAssetBalance(
        _ethProviders,
        depositChainId,
        depositAssetId,
        _depositAddress
      );
    } catch (e) {
      setIniting(false);
      setError(e);
      return;
    }
    console.log(
      `Starting balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${initialBalance.toString()}`
    );

    setListener(
      setInterval(async () => {
        let updatedBalance: BigNumber;
        try {
          updatedBalance = await getAssetBalance(
            _ethProviders,
            depositChainId,
            depositAssetId,
            _depositAddress
          );
        } catch (e) {
          console.warn(`Error fetching balance: ${e.message}`);
          return;
        }
        console.log(
          `Updated balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${updatedBalance.toString()}`
        );
        if (updatedBalance.lt(initialBalance)) {
          initialBalance = updatedBalance;
        }

        if (updatedBalance.gt(initialBalance)) {
          clearInterval(listener!);
          const transferAmount = updatedBalance.sub(initialBalance);
          initialBalance = updatedBalance;
          await transfer(_depositAddress, transferAmount);
        }
      }, 5_000)
    );
  };

  const stateReset = () => {
    setIniting(true);
    setActiveStep(-1);
    setIsError(false);
    setError(undefined);
    setDepositAddress(undefined);
    setActiveCrossChainTransferId(constants.HashZero);
    setScreen('Home');
    setActiveHeaderMessage(0);
    setAmount(BigNumber.from(0));
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
        console.error('Error initalizing Browser Node: ', e);
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
        setCrossChainTransfers({
          ...crossChainTransfers,
          [constants.HashZero]: TRANSFER_STATES.ERROR,
        });
        setError(e);
        setIsError(true);
        setIniting(false);
        return;
      }

      console.log('INITIALIZED BROWSER NODE');

      await getWithdrawAssetDecimals();

      setActiveMessage(1);
      setTips();
      const depositChannelRes = await connext.connextClient!.getStateChannelByParticipants(
        {
          chainId: depositChainId,
          counterparty: routerPublicIdentifier,
        }
      );
      if (depositChannelRes.isError) {
        setError(depositChannelRes.getError());
        setIsError(true);
        setIniting(false);
        return;
      }
      const depositChannel = depositChannelRes.getValue() as FullChannelState;
      const _depositAddress = depositChannel!.channelAddress;

      const withdrawChannelRes = await connext.connextClient!.getStateChannelByParticipants(
        {
          chainId: withdrawChainId,
          counterparty: routerPublicIdentifier,
        }
      );
      if (withdrawChannelRes.isError) {
        setError(withdrawChannelRes.getError());
        setIsError(true);
        setIniting(false);
        return;
      }
      const withdrawChannel = withdrawChannelRes.getValue() as FullChannelState;
      // callback for ready
      if (onReady) {
        onReady({
          depositChannelAddress: depositChannel.channelAddress,
          withdrawChannelAddress: withdrawChannel.channelAddress,
        });
      }

      setActiveMessage(2);
      const depositRes = await connext.connextClient!.reconcileDeposit({
        channelAddress: depositChannel!.channelAddress,
        assetId: depositAssetId,
      });
      if (depositRes.isError) {
        setError(depositChannelRes.getError());
        setIsError(true);
        setIniting(false);
        return;
      }

      const offChainAssetBalance = getBalanceForAssetId(
        depositChannel!,
        depositAssetId,
        'bob'
      );

      console.log(
        `Offchain balance for ${_depositAddress} of asset ${depositAssetId}: ${offChainAssetBalance}`
      );

      setDepositAddress(_depositAddress);
      const balanceBN = BigNumber.from(offChainAssetBalance);
      if (balanceBN.gt(0)) {
        console.log(`Found existing balance, transferring`);
        await transfer(_depositAddress, balanceBN);
      } else {
        await blockListenerAndTransfer(_depositAddress);
      }
      setIniting(false);
    };
    init();
  }, [showModal]);

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
      <CheckCircleRounded color="primary" />
    ) : active ? (
      error ? (
        <ErrorRounded color="error" />
      ) : (
        <CircularProgress size="1rem" color="primary" />
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

              {headerMessage()}

              {/* <Grid item>
                        <ThemeButton />
                      </Grid> */}

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
                          message={message()}
                          tip={tips()}
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

// @ts-ignore
const ThemeButton: FC = () => {
  const [isDark, setIsDark] = useState(false);

  theme.palette.mode = isDark ? 'dark' : 'light';

  const StyledTooltip = withStyles({
    tooltip: {
      marginTop: '0.2rem',
      backgroundColor: 'rgba(0,0,0,0.72)',
      color: '#fff',
    },
  })(Tooltip);

  return (
    <StyledTooltip
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      <IconButton onClick={() => setIsDark(!isDark)}>
        {isDark ? <WbSunny /> : <Brightness4 />}
      </IconButton>
    </StyledTooltip>
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
  onClose,
}) => (
  <>
    <Grid container className={styles} alignItems="center" direction="column">
      <CheckCircleTwoTone color="secondary" fontSize="large" />
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
            color="secondary"
            href={getExplorerLinkForTx(withdrawChainId, withdrawTx)}
            target="_blank"
          >
            Transaction Receipt
          </Button>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Grid container justifyContent="center">
          <Button variant="contained" color="secondary" onClick={onClose}>
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
}) => (
  <>
    <Grid container className={styles} alignItems="center" direction="column">
      <ErrorRounded fontSize="large" color="error" />
      <Typography gutterBottom variant="caption" color="error">
        Error
      </Typography>

      <Typography gutterBottom variant="caption" color="error" align="center">
        {`${crossChainTransferId.substring(0, 5)}... - ${error.message}`}
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

export default ConnextModal;
