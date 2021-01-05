import { BrowserNode } from '@connext/vector-browser-node';
import React, {
  FC,
  useRef,
  useEffect,
  useState,
  ReactElement,
  MouseEvent,
  KeyboardEvent,
} from 'react';
import {
  Dialog,
  DialogTitle,
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
  MenuItem,
  Popper,
  MenuList,
  ClickAwayListener,
  Paper,
  Grow,
  CircularProgress,
  Tooltip,
  withStyles,
  StepIconProps,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import {
  MoreVert,
  FileCopy,
  Check,
  Close,
  DoubleArrow,
  CropFree,
  Brightness4,
  WbSunny,
  CheckCircleRounded,
  FiberManualRecordOutlined,
  ErrorRounded,
} from '@material-ui/icons';
import {
  makeStyles,
  createStyles,
  Theme,
  createMuiTheme,
} from '@material-ui/core/styles';
import { purple, green } from '@material-ui/core/colors';
// @ts-ignore
import QRCode from 'qrcode.react';
import { BigNumber, constants, utils } from 'ethers';
import { EngineEvents, FullChannelState } from '@connext/vector-types';
import { getBalanceForAssetId, getRandomBytes32 } from '@connext/vector-utils';
import {
  CHAIN_INFO_URL,
  getAssetName,
  TransferStates,
  TRANSFER_STATES,
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

const theme = createMuiTheme({
  palette: {
    mode: 'light',
    primary: {
      main: purple[500],
    },
    secondary: {
      main: green[700],
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
    header: {},
    networkBar: { paddingBottom: '1rem' },
    steps: { paddingBottom: '1rem' },
    status: { paddingBottom: '1rem' },
    ethereumAddress: { paddingBottom: '1rem' },
    completeState: { paddingBottom: '1rem' },
    errorState: { paddingBottom: '1rem' },
  })
);

export type ConnextModalProps = {
  showModal: boolean;
  routerPublicIdentifier: string;
  depositChainId: number;
  depositAssetId: string;
  withdrawChainId: number;
  withdrawAssetId: string;
  withdrawalAddress: string;
  onClose: () => void;
  connextNode?: BrowserNode;
};

type Screens = 'Recover' | 'Home';

const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  routerPublicIdentifier,
  depositChainId,
  depositAssetId,
  withdrawChainId,
  withdrawAssetId,
  withdrawalAddress,
  onClose,
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

  const transferState: TransferStates =
    crossChainTransfers[activeCrossChainTransferId] ?? TRANSFER_STATES.INITIAL;

  const registerEngineEventListeners = (
    node: BrowserNode,
    startingBalance: BigNumber
  ): void => {
    node.on(EngineEvents.DEPOSIT_RECONCILED, data => {
      console.log('EngineEvents.DEPOSIT_RECONCILED: ', data);
      if (
        startingBalance.lt(data.channelBalance.amount[1]) && // deposit actually added balance
        data.channelAddress === depositAddress // depositAddress is channelAddress on deposit chain
      ) {
        // if (data.meta.crossChainTransferId) {
        setCrossChainTransferWithErrorTimeout(
          activeCrossChainTransferId,
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

  const transfer = async (
    _depositAddress: string,
    transferAmount: BigNumber
  ) => {
    const _ethProviders = hydrateProviders(depositChainId, withdrawChainId);
    const crossChainTransferId = getRandomBytes32();
    setActiveCrossChainTransferId(crossChainTransferId);
    const updated = { ...crossChainTransfers };
    updated[crossChainTransferId] = TRANSFER_STATES.DEPOSITING;
    setCrossChainTransfers(updated);
    setActiveStep(activePhase(TRANSFER_STATES.DEPOSITING));
    setIsError(false);
    _ethProviders[depositChainId].off('block');

    await connext
      .connextClient!.crossChainTransfer({
        amount: transferAmount.toString(),
        fromAssetId: depositAssetId,
        fromChainId: depositChainId,
        toAssetId: withdrawAssetId,
        toChainId: withdrawChainId,
        reconcileDeposit: true,
        withdrawalAddress,
        meta: { crossChainTransferId },
      })
      .then(result => {
        console.log('crossChainTransfer: ', result);
        setWithdrawTx(result.withdrawalTx);
        setSentAmount(result.withdrawalAmount ?? '0');
        setActiveStep(activePhase(TRANSFER_STATES.COMPLETE));
        setIsError(false);
        updated[crossChainTransferId] = TRANSFER_STATES.COMPLETE;
        setCrossChainTransfers(updated);
      })
      .catch(e => {
        setError(e);
        console.error('Error in crossChainTransfer: ', e);
        const updated = { ...crossChainTransfers };
        updated[crossChainTransferId] = TRANSFER_STATES.ERROR;
        setIsError(true);
        setCrossChainTransfers(updated);
      });
  };

  const blockListenerAndTransfer = async (_depositAddress: string) => {
    const _ethProviders = hydrateProviders(depositChainId, withdrawChainId);

    let startingBalance: BigNumber;
    try {
      startingBalance = await getAssetBalance(
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
      `Starting balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${startingBalance.toString()}`
    );
    _ethProviders[depositChainId].on('block', async blockNumber => {
      console.log('New blockNumber: ', blockNumber);
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
      if (updatedBalance.gt(startingBalance)) {
        const transferAmount = updatedBalance.sub(startingBalance);
        startingBalance = updatedBalance;
        await transfer(_depositAddress, transferAmount);
      }
    });
  };

  const stateReset = () => {
    setIniting(true);
    setActiveStep(-1);
    setIsError(false);
    setError(undefined);
    setDepositAddress(undefined);
    setActiveCrossChainTransferId(constants.HashZero);
  };

  const handleClose = () => {
    const _ethProviders = hydrateProviders(depositChainId, withdrawChainId);
    _ethProviders[depositChainId].off('block');
    onClose();
  };

  useEffect(() => {
    const init = async () => {
      if (showModal) {
        stateReset();
        await getChainInfo();

        try {
          // browser node object
          await connext.connectNode(
            connextNode,
            routerPublicIdentifier,
            depositChainId,
            withdrawChainId
          );
        } catch (e) {
          console.error('Error initalizing Browser Node: ', e);
          if (e.message.includes('localStorage not available in this window')) {
            alert(
              'Please disable shields or ad blockers and try again. Connext requires cross-site cookies to store your channel states.'
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
        setDepositAddress(_depositAddress);

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
          `balance on channel for ${_depositAddress} of asset ${depositAssetId}: ${offChainAssetBalance}`
        );

        const balanceBN = BigNumber.from(offChainAssetBalance);
        registerEngineEventListeners(connext.connextClient!, balanceBN);
        if (balanceBN.gt(0)) {
          console.log(`Found existing balance, transferring`);
          await transfer(_depositAddress, balanceBN);
        } else {
          await blockListenerAndTransfer(_depositAddress);
        }
        setIniting(false);
      }
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
              <Typography variant="h6" align="center">
                Waiting for deposit...
              </Typography>
              <Typography variant="body2" align="center">
                Send ONLY{' '}
                <a
                  href={getExplorerLinkForAsset(depositChainId, depositAssetId)}
                  target="_blank"
                >
                  {getAssetName(depositAssetId, depositChainId)}
                </a>{' '}
                to the Deposit Address above.
              </Typography>
              <Typography variant="body2" align="center">
                Please do not close or refresh window while in progress!
              </Typography>
            </>
          );
        case 0:
          return (
            <Typography variant="body2" align="center">
              Detected deposit on-chain({depositChainName}), depositing into
              state channel!
            </Typography>
          );
        case 1:
          return (
            <Typography variant="body2" align="center">
              Transferring from {depositChainName} to {withdrawChainName}
            </Typography>
          );
        case 2:
          return (
            <Typography variant="body2" align="center">
              Withdrawing funds back on-chain({withdrawChainName}!
            </Typography>
          );
        case 3:
          return (
            <>
              <CompleteState
                withdrawChainName={withdrawChainName}
                withdrawTx={withdrawTx!}
                sentAmount={sentAmount!}
                withdrawChainId={withdrawChainId}
                withdrawAssetId={withdrawAssetId}
                styles={classes.completeState}
              />
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

    return <div>{icons[String(props.icon)]}</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Dialog open={showModal} fullWidth={true} maxWidth="xs">
        <Card className={classes.card}>
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
              <Close />
            </IconButton>

            <Typography gutterBottom variant="h6">
              Send{' '}
              <a
                href={getExplorerLinkForAsset(depositChainId, depositAssetId)}
                target="_blank"
              >
                {getAssetName(depositAssetId, depositChainId)}
              </a>
            </Typography>

            {/* <Grid item>
              <ThemeButton />
            </Grid> */}

            <Options setScreen={setScreen} activeScreen={screen} />
          </Grid>
          {screen === 'Home' && (
            <div style={{ padding: '1rem' }}>
              {depositAddress ? (
                <>
                  <NetworkBar
                    depositChainName={depositChainName}
                    withdrawChainName={withdrawChainName}
                    styles={classes.networkBar}
                  />
                  <EthereumAddress
                    depositAddress={depositAddress}
                    styles={classes.ethereumAddress}
                  />
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
                  <Grid container className={classes.status}>
                    <Grid item xs={12}>
                      {getStepContent(activeStep)}
                    </Grid>
                  </Grid>
                  <Grid container>
                    <Grid item xs={12}>
                      <TextField
                        label="Receiver Address"
                        defaultValue={withdrawalAddress}
                        InputProps={{
                          readOnly: true,
                        }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
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
                        message={'Setting up channels...'}
                        initializing={initing}
                      />
                      <Skeleton variant="rect" height={300} />
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {screen === 'Recover' && (
            <Recover
              depositAddress={depositAddress}
              depositChainId={depositChainId}
            />
          )}

          <Grid id="Footer" container direction="row" justifyContent="center">
            <Typography variant="overline">
              <a href="https://connext.network" target="_blank">
                Powered By Connext
              </a>
            </Typography>
          </Grid>
        </Card>
      </Dialog>
    </ThemeProvider>
  );
};

const Options: FC<{
  setScreen: (screen: Screens) => any;
  activeScreen: Screens;
}> = ({ setScreen, activeScreen }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = (event: MouseEvent<EventTarget>) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);
  return (
    <>
      <IconButton
        aria-label="options"
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <MoreVert />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="menu-list-grow"
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem
                    id="link"
                    disabled={activeScreen === 'Home'}
                    onClick={() => setScreen('Home')}
                  >
                    Home
                  </MenuItem>
                  <br />
                  <MenuItem
                    id="link"
                    disabled={activeScreen === 'Recover'}
                    onClick={() => setScreen('Recover')}
                  >
                    Recovery
                  </MenuItem>
                  <br />
                  <MenuItem
                    id="link"
                    onClick={() =>
                      window.open(
                        'https://discord.com/channels/454734546869551114',
                        '_blank'
                      )
                    }
                  >
                    {/* <Chat /> */}
                    Discord
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
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

export interface EthereumAddressProps {
  depositAddress: string;
  styles: string;
}

const EthereumAddress: FC<EthereumAddressProps> = props => {
  const { depositAddress, styles } = props;
  const [copiedDepositAddress, setCopiedDepositAddress] = useState<boolean>(
    false
  );

  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Grid container alignItems="flex-end" className={styles}>
        <Grid item xs={12}>
          <TextField
            label="Deposit Address"
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
                  <IconButton onClick={handleOpen} edge="end">
                    <CropFree />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        </Grid>
        <Dialog
          onClose={handleClose}
          aria-labelledby="simple-dialog-title"
          open={open}
        >
          <DialogTitle id="simple-dialog-title">
            Scan this code using your mobile wallet app
          </DialogTitle>
          <Grid
            id="qrcode"
            container
            direction="row"
            justifyContent="center"
            alignItems="flex-start"
            className={styles}
          >
            <QRCode value={depositAddress} />
          </Grid>
        </Dialog>
      </Grid>
    </>
  );
};
export interface NetworkBarProps {
  depositChainName: string;
  withdrawChainName: string;
  styles: string;
}

const NetworkBar: FC<NetworkBarProps> = props => {
  const { depositChainName, withdrawChainName, styles } = props;

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
          <Chip color="secondary" label={depositChainName} />
        </Grid>
        <DoubleArrow />
        <Grid item>
          <Chip color="primary" label={withdrawChainName} />
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
  sentAmount: string;
  styles: string;
}

const CompleteState: FC<CompleteStateProps> = ({
  withdrawTx,
  withdrawChainName,
  sentAmount,
  withdrawAssetId,
  withdrawChainId,
  styles,
}) => (
  <>
    <Grid container className={styles} alignItems="center" direction="column">
      <CheckCircleRounded color="secondary" fontSize="large" />
      <Typography gutterBottom variant="h6">
        Success
      </Typography>

      <Typography gutterBottom variant="body1" color="secondary" align="center">
        {utils.formatEther(sentAmount)}{' '}
        <a
          href={getExplorerLinkForAsset(withdrawChainId, withdrawAssetId)}
          target="_blank"
        >
          {getAssetName(withdrawAssetId, withdrawChainId)}
        </a>{' '}
        has been successfully transferred to {withdrawChainName}
      </Typography>
    </Grid>

    <Grid container direction="row" justifyContent="center">
      <Button
        variant="outlined"
        color="primary"
        href={getExplorerLinkForTx(withdrawChainId, withdrawTx)}
        target="_blank"
      >
        View Withdrawal Tx
      </Button>
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

const useRecoverStyles = makeStyles(theme => ({
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
}));

const Recover: FC<{ depositAddress?: string; depositChainId: number }> = ({
  depositAddress,
  depositChainId,
}) => {
  const classes = useRecoverStyles();
  const [recoverTokenAddress, setRecoverTokenAddress] = useState(
    constants.AddressZero
  );
  const [recoverTokenAddressError, setRecoverTokenAddressError] = useState(
    false
  );
  const [recoverWithdrawalAddress, setRecoverWithdrawalAddress] = useState('');
  const [
    recoverWithdrawalAddressError,
    setRecoverWithdrawalAddressError,
  ] = useState(false);
  const [withdrawalTxHash, setWithdrawalTxHash] = useState(constants.HashZero);
  const [errorMessage, setErrorMessage] = useState('Unknown error');
  const [status, setStatus] = useState<
    'Initial' | 'Loading' | 'Success' | 'Error'
  >('Initial');

  const recover = async (assetId: string, withdrawalAddress: string) => {
    const deposit = await connext.connextClient!.reconcileDeposit({
      assetId,
      channelAddress: depositAddress!,
    });
    if (deposit.isError) {
      setStatus('Error');
      setErrorMessage(deposit.getError()!.message);
      throw deposit.getError();
    }

    const updatedChannel = await connext.connextClient!.getStateChannel({
      channelAddress: depositAddress!,
    });
    if (updatedChannel.isError || !updatedChannel.getValue()) {
      setStatus('Error');
      setErrorMessage(
        updatedChannel.getError()?.message ?? 'Channel not found'
      );
      throw updatedChannel.getError() ?? new Error('Channel not found');
    }
    const endingBalance = getBalanceForAssetId(
      updatedChannel.getValue() as FullChannelState,
      recoverTokenAddress,
      'bob'
    );

    const endingBalanceBn = BigNumber.from(endingBalance);
    if (endingBalanceBn.isZero()) {
      setStatus('Error');
      setErrorMessage('No balance found to recover');
    }
    console.log(
      `Found ${endingBalanceBn.toString()} of ${assetId}, attempting withdrawal`
    );

    const withdrawRes = await connext.connextClient!.withdraw({
      amount: endingBalance,
      assetId,
      channelAddress: depositAddress!,
      recipient: withdrawalAddress,
    });
    if (withdrawRes.isError) {
      setStatus('Error');
      throw withdrawRes.getError();
    }
    console.log('Withdraw successful: ', withdrawRes.getValue());
    setWithdrawalTxHash(withdrawRes.getValue().transactionHash!);
    setStatus('Success');
  };

  const isValidAddress = (input: string): boolean => {
    const valid = input.match(/0x[0-9a-fA-F]{40}/);
    return !!valid;
  };

  return (
    <div style={{ padding: '1rem' }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h6" align="center">
            Recover lost funds
          </Typography>
          <Typography variant="body2" align="center">
            Uh oh! Did you send the wrong asset to the deposit address? Fill out
            the details below and we will attempt to recover your assets from
            the state channels!
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TextField
            disabled={status === 'Loading'}
            label="Token Address (0x000... for ETH)"
            value={recoverTokenAddress}
            error={recoverTokenAddressError}
            helperText={
              recoverTokenAddressError && 'Must be an Ethereum address'
            }
            onChange={event => {
              setRecoverTokenAddress(event.target.value);
              setRecoverTokenAddressError(!isValidAddress(event.target.value));
            }}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TextField
            disabled={status === 'Loading'}
            label="Withdrawal Address"
            value={recoverWithdrawalAddress}
            error={recoverWithdrawalAddressError}
            helperText={
              recoverWithdrawalAddressError && 'Must be an Ethereum address'
            }
            onChange={event => {
              setRecoverWithdrawalAddress(event.target.value);
              setRecoverWithdrawalAddressError(
                !isValidAddress(event.target.value)
              );
            }}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>
      {status !== 'Success' && (
        <Grid container justifyContent="center" spacing={4}>
          <Grid item xs={4}>
            <div className={classes.wrapper}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={
                  status === 'Loading' ||
                  recoverWithdrawalAddressError ||
                  recoverTokenAddressError ||
                  !recoverTokenAddress ||
                  !recoverWithdrawalAddress
                }
                onClick={() =>
                  recover(recoverTokenAddress, recoverWithdrawalAddress)
                }
              >
                Recover
              </Button>
              {status === 'Loading' && (
                <CircularProgress
                  size={24}
                  className={classes.buttonProgress}
                />
              )}
            </div>
          </Grid>
        </Grid>
      )}
      {status === 'Success' && (
        <>
          <Grid container alignItems="center" direction="column">
            <CheckCircleRounded color="secondary" fontSize="large" />
            <Typography gutterBottom variant="h6">
              Success
            </Typography>

            <Typography
              gutterBottom
              variant="body1"
              color="secondary"
              align="center"
            >
              Successfully withdrew funds
            </Typography>
          </Grid>

          <Grid container direction="row" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              href={getExplorerLinkForTx(depositChainId, withdrawalTxHash)}
              target="_blank"
            >
              View Withdrawal Tx
            </Button>
          </Grid>
        </>
      )}
      {status === 'Error' && (
        <>
          <Grid container alignItems="center" direction="column">
            <ErrorRounded fontSize="large" color="error" />
            <Typography gutterBottom variant="caption" color="error">
              Error
            </Typography>

            <Typography
              gutterBottom
              variant="caption"
              color="error"
              align="center"
            >
              {errorMessage}
            </Typography>
          </Grid>
        </>
      )}
    </div>
  );
};

export default ConnextModal;
