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
  MenuItem,
  Menu,
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
  getExplorerLink,
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
    dialog: {},
    header: {},
    networkBar: { paddingBottom: '1rem' },
    body: { padding: '1rem' },
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

type Screens = 'Recover' | 'Home';

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
  const [sentAmount, setSentAmount] = useState<string>('0');

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [crossChainTransfers, setCrossChainTransfers] = useState<{
    [crossChainTransferId: string]: TransferStates;
  }>({});

  const [message, setMessage] = useState<string>('');

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

  const transfer = async (
    _depositAddress: string,
    transferAmount: BigNumber
  ) => {
    registerEngineEventListeners(connext.connextClient!, transferAmount);
    const crossChainTransferId = getRandomBytes32();
    setActiveCrossChainTransferId(crossChainTransferId);
    const updated = { ...crossChainTransfers };
    updated[crossChainTransferId] = TRANSFER_STATES.DEPOSITING;
    setCrossChainTransfers(updated);
    setActiveStep(activePhase(TRANSFER_STATES.DEPOSITING));
    setIsError(false);

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
        _ethProviders[depositChainId].off('block');
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
    setScreen('Home');
  };

  const handleClose = () => {
    const _ethProviders = hydrateProviders(depositChainId, withdrawChainId);
    _ethProviders[depositChainId].off('block');
    onClose();
  };

  useEffect(() => {
    const init = async () => {
      if (!showModal) {
        return;
      }
      setMessage('Loading...');
      stateReset();
      await getChainInfo();

      try {
        // browser node object
        setMessage('Setting up channels...');
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

      setMessage('Looking for existing channel balance');
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
              <EthereumAddress
                depositChainName={depositChainName}
                depositAddress={depositAddress!}
                styles={classes.ethereumAddress}
              />
              <Grid
                id="qrcode"
                container
                direction="row"
                justifyContent="center"
                alignItems="flex-start"
                className={classes.ethereumAddress}
              >
                <QRCode value={depositAddress} />
              </Grid>
              <Grid container className={classes.status}>
                <Grid item xs={12}>
                  <Typography variant="h6" align="center" color="textPrimary">
                    Waiting for deposit...
                  </Typography>
                  <Typography variant="subtitle1" align="center">
                    Send only{' '}
                    <a
                      href={getExplorerLinkForAsset(
                        depositChainId,
                        depositAssetId
                      )}
                      target="_blank"
                    >
                      {getAssetName(depositAssetId, depositChainId)}
                    </a>{' '}
                    to the Deposit Address above.
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    align="center"
                    color="textSecondary"
                  >
                    Please do not close or refresh window while in progress!
                  </Typography>
                </Grid>
              </Grid>
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
        case 0:
          return (
            <Grid container className={classes.status}>
              <Grid item xs={12}>
                <Typography variant="body1" align="center">
                  Detected deposit on-chain({depositChainName}), depositing into
                  state channel!
                </Typography>
              </Grid>
            </Grid>
          );
        case 1:
          return (
            <Grid container className={classes.status}>
              <Grid item xs={12}>
                <Typography variant="body1" align="center">
                  Transferring from {depositChainName} to {withdrawChainName}
                </Typography>
              </Grid>
            </Grid>
          );
        case 2:
          return (
            <Grid container className={classes.status}>
              <Grid item xs={12}>
                <Typography variant="body1" align="center">
                  Withdrawing funds to onchain to {withdrawChainName}!
                </Typography>
              </Grid>
            </Grid>
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
                    withdrawalAddress={withdrawalAddress}
                    styles={classes.completeState}
                    onClose={handleClose}
                  />
                </Grid>
              </Grid>
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
            <Typography variant="h6">
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
            <>
              <Grid container id="body" className={classes.body}>
                {depositAddress ? (
                  <>
                    <NetworkBar
                      depositChainName={depositChainName}
                      depositChainId={depositChainId}
                      withdrawChainName={withdrawChainName}
                      withdrawChainId={withdrawChainId}
                      styles={classes.networkBar}
                    />

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
                        <Loading message={message} initializing={initing} />
                        <Skeleton variant="rect" height={300} />
                      </>
                    )}
                  </>
                )}
              </Grid>
            </>
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
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
        edge="end"
      >
        <MoreVert />
      </IconButton>

      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            paddingLeft: '4px',
            paddingRight: '4px',
            marginTop: '40px',
            marginLeft: '20px',
          },
        }}
      >
        <MenuItem
          id="link"
          disabled={activeScreen === 'Home'}
          onClick={() => setScreen('Home')}
          alignItems="center"
        >
          Home
        </MenuItem>
        <br />
        <MenuItem
          id="link"
          disabled={activeScreen === 'Recover'}
          onClick={() => setScreen('Recover')}
          alignItems="center"
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
          alignItems="center"
        >
          <Typography variant="inherit">Help</Typography>
        </MenuItem>
      </Menu>
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
  depositChainId: number;
  withdrawChainName: string;
  withdrawChainId: number;
  styles: string;
}

const NetworkBar: FC<NetworkBarProps> = ({
  depositChainName,
  depositChainId,
  withdrawChainName,
  withdrawChainId,
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
          <Chip
            color="secondary"
            label={depositChainName}
            clickable
            onClick={() =>
              window.open(getExplorerLink(depositChainId), '_blank')
            }
          />
        </Grid>
        <DoubleArrow />
        <Grid item>
          <Chip
            color="primary"
            label={withdrawChainName}
            clickable
            onClick={() =>
              window.open(getExplorerLink(withdrawChainId), '_blank')
            }
          />
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
  withdrawalAddress,
  styles,
  onClose,
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
            color="primary"
            href={getExplorerLinkForTx(withdrawChainId, withdrawTx)}
            target="_blank"
          >
            View Withdrawal Tx
          </Button>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Grid container justifyContent="center">
          <Button variant="contained" color="primary" onClick={onClose}>
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
  root: { padding: '1rem' },
  helpText: { padding: '1rem' },
  assetField: { paddingBottom: '1rem' },
  addressField: { paddingBottom: '1rem' },
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
    <Grid className={classes.root}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h6" align="center">
            Recover lost funds
          </Typography>
          <Typography
            variant="body2"
            align="center"
            className={classes.helpText}
          >
            Uh oh! Did you send the wrong asset to the deposit address? Fill out
            the details below and we will attempt to recover your assets from
            the state channels!
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={12} className={classes.assetField}>
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
        <Grid item xs={12} className={classes.addressField}>
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
    </Grid>
  );
};

export default ConnextModal;
