import { BrowserNode } from '@connext/vector-browser-node';
import {
  Dialog,
  Grid,
  makeStyles,
  Divider,
  Button,
  Typography,
  DialogContent,
  DialogActions,
  Skeleton,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@material-ui/core';
import { FileCopy, Check } from '@material-ui/icons';
import {
  ThemeProvider,
  unstable_createMuiStrictModeTheme,
} from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';
// @ts-ignore
import QRCode from 'qrcode.react';
import Chip from '@material-ui/core/Chip';
import {
  providers,
  getDefaultProvider,
  constants,
  Contract,
  BigNumber,
  utils,
} from 'ethers';
import { EngineEvents, ERC20Abi } from '@connext/vector-types';
import { getRandomBytes32 } from '@connext/vector-utils';

// @ts-ignore
import LoadingGif from '../assets/loading.gif';

const theme = unstable_createMuiStrictModeTheme({ palette: { mode: 'dark' } });

const CHAIN_INFO_URL = 'https://chainid.network/chains.json';

const PROD_ROUTER_IDENTIFIER =
  'vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q';

const PROD_IFRAME_WALLET = 'https://wallet.connext.network';

const routerPublicIdentifier =
  process.env.REACT_APP_ROUTER_IDENTIFIER || PROD_ROUTER_IDENTIFIER;
console.log('routerPublicIdentifier: ', routerPublicIdentifier);

const iframeSrc = process.env.REACT_APP_IFRAME_SRC || PROD_IFRAME_WALLET;
console.log('iframeSrc: ', iframeSrc);

const ethProvidersOverrides = JSON.parse(
  process.env.REACT_APP_ETH_PROVIDERS || '{}'
);
console.log('ethProvidersOverrides: ', ethProvidersOverrides);

const TRANSFER_STATES = {
  INITIAL: 'INITIAL',
  DEPOSITING: 'DEPOSITING',
  TRANSFERRING: 'TRANSFERRING',
  WITHDRAWING: 'WITHDRAWING',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
} as const;
export type TransferStates = keyof typeof TRANSFER_STATES;

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
  },
  spacing: {
    margin: theme.spacing(3, 2),
  },
  dialog: { height: '450px' },
}));

type ConnextModalProps = {
  showModal: boolean;
  depositChainId: number;
  depositAssetId: string;
  withdrawChainId: number;
  withdrawAssetId: string;
  withdrawalAddress: string;
  onClose: () => void;
};

const getExplorerLinkForTx = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case 1: {
      return `https://etherscan.io/tx/${txHash}`;
    }
    case 4: {
      return `https://rinkeby.etherscan.io/tx/${txHash}`;
    }
    case 5: {
      return `https://goerli.etherscan.io/tx/${txHash}`;
    }
    case 42: {
      return `https://kovan.etherscan.io/tx/${txHash}`;
    }
    case 80001: {
      return `https://explorer-mumbai.maticvigil.com/tx/${txHash}`;
    }
    case 152709604825713: {
      return `https://explorer.offchainlabs.com/#/tx/${txHash}`;
    }
  }
  return '#';
};

const getProviderUrlForChain = (chainId: number): string | undefined => {
  switch (chainId) {
    case 5: {
      return `https://goerli.prylabs.net`;
    }
    case 80001: {
      return `https://rpc-mumbai.matic.today`;
    }
    case 152709604825713: {
      return `https://kovan2.arbitrum.io/rpc`;
    }
  }
  return undefined;
};

export const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  depositChainId,
  depositAssetId,
  withdrawChainId,
  withdrawAssetId,
  withdrawalAddress,
  onClose,
}) => {
  const classes = useStyles();
  const [depositAddress, setDepositAddress] = useState<string>();
  const [depositChainName, setDepositChainName] = useState<string>(
    depositChainId.toString()
  );
  const [withdrawChainName, setWithdrawChainName] = useState<string>(
    withdrawChainId.toString()
  );
  const [sentAmount, setSentAmount] = useState<string>('0.0');

  const [withdrawTx, setWithdrawTx] = useState<string>();
  const [crossChainTransfers, setCrossChainTransfers] = useState<{
    [crossChainTransferId: string]: TransferStates;
  }>({});
  const [initing, setIniting] = useState<boolean>(true);
  const [copiedDepositAddress, setCopiedDepositAddress] = useState<boolean>(
    false
  );

  const [
    activeCrossChainTransferId,
    setActiveCrossChainTransferId,
  ] = useState<string>('');

  const [error, setError] = useState<Error>();

  const registerEngineEventListeners = (node: BrowserNode): void => {
    node.on(EngineEvents.DEPOSIT_RECONCILED, (data) => {
      if (data.meta.crossChainTransferId) {
        setCrossChainTransferWithErrorTimeout(
          data.meta.crossChainTransferId,
          TRANSFER_STATES.TRANSFERRING
        );
      }
    });
    node.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, (data) => {
      if (
        data.transfer.meta.crossChainTransferId &&
        data.transfer.initiator === node.signerAddress
      ) {
        setCrossChainTransferWithErrorTimeout(
          data.transfer.meta.crossChainTransferId,
          TRANSFER_STATES.WITHDRAWING
        );

        setSentAmount(utils.formatEther(data.channelBalance.amount[1]));
      }
    });
    node.on(EngineEvents.WITHDRAWAL_RESOLVED, (data) => {
      if (
        data.transfer.meta.crossChainTransferId &&
        data.transfer.initiator === node.signerAddress
      ) {
        if (data.transfer.meta.crossChainTransferId) {
          setCrossChainTransferWithErrorTimeout(
            data.transfer.meta.crossChainTransferId,
            TRANSFER_STATES.COMPLETE
          );
        }
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
    setTimeout(() => {
      if (crossChainTransfers[crossChainTransferId] !== phase) {
        return;
      }
      // Error if not updated
      let tracked = { ...crossChainTransfers };
      tracked[crossChainTransferId] = TRANSFER_STATES.ERROR;
      setCrossChainTransfers(tracked);
      setError(new Error(`No updates within 30s for ${crossChainTransferId}`));
    }, 30_000);
  };

  useEffect(() => {
    const init = async () => {
      if (showModal) {
        try {
          const chainInfo: any[] = await utils.fetchJson(CHAIN_INFO_URL);
          const depositChainInfo = chainInfo.find(
            (info) => info.chainId === depositChainId
          );
          if (depositChainInfo) {
            setDepositChainName(depositChainInfo.name);
          }

          const withdrawChainInfo = chainInfo.find(
            (info) => info.chainId === withdrawChainId
          );
          if (withdrawChainInfo) {
            setWithdrawChainName(withdrawChainInfo.name);
          }
        } catch (e) {
          console.warn(`Could not fetch chain info from ${CHAIN_INFO_URL}`);
        }
        const _ethProviders: { [chainId: number]: providers.BaseProvider } = {};
        for (const chainId of [depositChainId, withdrawChainId]) {
          if (ethProvidersOverrides[chainId]) {
            _ethProviders[chainId] = new providers.JsonRpcProvider(
              ethProvidersOverrides[chainId]
            );
          } else {
            const providerUrl = getProviderUrlForChain(chainId);
            if (providerUrl) {
              _ethProviders[chainId] = new providers.JsonRpcProvider(
                providerUrl
              );
            } else {
              _ethProviders[chainId] = getDefaultProvider(chainId as any);
            }
          }
        }
        const browserNode = new BrowserNode({
          routerPublicIdentifier,
          iframeSrc,
          supportedChains: [depositChainId, withdrawChainId],
        });
        try {
          await browserNode.init();
        } catch (e) {
          setIniting(false);
          setError(e);
          return;
        }
        registerEngineEventListeners(browserNode);
        console.log('INITIALIZED BROWSER NODE');
        const depositChannelRes = await browserNode.getStateChannelByParticipants(
          {
            chainId: depositChainId,
            counterparty: routerPublicIdentifier,
          }
        );
        if (depositChannelRes.isError) {
          setIniting(false);
          setError(depositChannelRes.getError());
          return;
        }
        const depositChannel = depositChannelRes.getValue();
        const _depositAddress = depositChannel.channelAddress;
        setDepositAddress(_depositAddress);

        const withdrawChannelRes = await browserNode.getStateChannelByParticipants(
          {
            chainId: withdrawChainId,
            counterparty: routerPublicIdentifier,
          }
        );
        if (withdrawChannelRes.isError) {
          setIniting(false);
          setError(withdrawChannelRes.getError());
          return;
        }
        const withdrawChannel = withdrawChannelRes.getValue();

        const getAssetBalance = async (
          chainId: number,
          assetId: string,
          balanceOfAddress: string
        ): Promise<BigNumber> =>
          assetId === constants.AddressZero
            ? await _ethProviders[chainId].getBalance(balanceOfAddress)
            : await new Contract(
                assetId,
                ERC20Abi,
                _ethProviders[chainId]
              ).balanceOf(balanceOfAddress);

        let startingBalance: BigNumber;
        try {
          startingBalance = await getAssetBalance(
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
        _ethProviders[depositChainId].on('block', async (blockNumber) => {
          console.log('New blockNumber: ', blockNumber);
          let updatedBalance: BigNumber;
          try {
            updatedBalance = await getAssetBalance(
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
            const crossChainTransferId = getRandomBytes32();
            setActiveCrossChainTransferId(crossChainTransferId);
            const updated = { ...crossChainTransfers };
            updated[crossChainTransferId] = TRANSFER_STATES.DEPOSITING;
            setCrossChainTransfers(updated);
            // TODO: no need to do this if tracking via transferID, but if
            // modal is only designed for one transfer, meh
            _ethProviders[depositChainId].off('block');
            browserNode
              .crossChainTransfer({
                amount: transferAmount.toString(),
                fromAssetId: depositAssetId,
                fromChainId: depositChainId,
                toAssetId: withdrawAssetId,
                toChainId: withdrawChainId,
                reconcileDeposit: true,
                withdrawalAddress,
                meta: { crossChainTransferId },
              })
              .then((crossChainTransfer) => {
                console.log('crossChainTransfer: ', crossChainTransfer);
                setWithdrawTx(crossChainTransfer.withdrawalTx);
                const updated = { ...crossChainTransfers };
                updated[crossChainTransferId] = TRANSFER_STATES.COMPLETE;
                setCrossChainTransfers(updated);
              })
              .catch((e) => {
                setError(e);
                console.error('Error in crossChainTransfer: ', e);
                const updated = { ...crossChainTransfers };
                updated[crossChainTransferId] = TRANSFER_STATES.ERROR;
                setCrossChainTransfers(updated);
              });
          }
        });
        setIniting(false);
      }
    };
    init();
  }, [showModal]);
  const transferState: TransferStates =
    crossChainTransfers[activeCrossChainTransferId] ?? TRANSFER_STATES.INITIAL;

  return (
    <ThemeProvider theme={theme}>
      <Dialog open={showModal} fullWidth={true} maxWidth="xs">
        <DialogContent
          className={classes.dialog}
          style={{
            backgroundColor: [
              TRANSFER_STATES.INITIAL,
              TRANSFER_STATES.COMPLETE,
              TRANSFER_STATES.ERROR,
            ].includes(transferState as any)
              ? undefined
              : '#fbd116',
          }}
        >
          {initing && <LoadingState />}
          {!initing && transferState === TRANSFER_STATES.INITIAL && (
            <InitialState
              depositAddress={depositAddress}
              depositChainName={depositChainName}
              withdrawChainName={withdrawChainName}
              withdrawalAddress={withdrawalAddress}
              copiedDepositAddress={copiedDepositAddress}
              setCopiedDepositAddress={setCopiedDepositAddress}
            />
          )}
          {!initing && transferState === TRANSFER_STATES.DEPOSITING && (
            <DepositingState depositChainName={depositChainName} />
          )}
          {!initing && transferState === TRANSFER_STATES.TRANSFERRING && (
            <TransferringState
              depositChainName={depositChainName}
              withdrawChainName={withdrawChainName}
            />
          )}
          {!initing && transferState === TRANSFER_STATES.WITHDRAWING && (
            <WithdrawingState withdrawChainName={withdrawChainName} />
          )}
          {!initing && transferState === TRANSFER_STATES.COMPLETE && (
            <CompleteState
              withdrawChainName={withdrawChainName}
              withdrawTx={withdrawTx!}
              sentAmount={sentAmount}
              withdrawChainId={withdrawChainId}
            />
          )}
          {!initing && transferState === TRANSFER_STATES.ERROR && (
            <ErrorState
              error={error ?? new Error('unknown')}
              crossChainTransferId={activeCrossChainTransferId}
            />
          )}
        </DialogContent>
        <DialogActions>
          {[
            TRANSFER_STATES.INITIAL,
            TRANSFER_STATES.COMPLETE,
            TRANSFER_STATES.ERROR,
          ].includes(transferState as any) && (
            <Button onClick={onClose}>Close</Button>
          )}
          <Typography variant="body1">Powered By Connext</Typography>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

const LoadingState: FC = () => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <CircularProgress />
      </Grid>
    </Grid>
  </>
);

const InitialState: FC<{
  depositAddress?: string;
  depositChainName: string;
  withdrawChainName: string;
  withdrawalAddress: string;
  copiedDepositAddress: boolean;
  setCopiedDepositAddress: (val: boolean) => void;
}> = ({
  depositAddress,
  depositChainName,
  withdrawChainName,
  withdrawalAddress,
  copiedDepositAddress,
  setCopiedDepositAddress,
}) => (
  <>
    {depositAddress ? (
      <>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography gutterBottom variant="h6">
              Send To
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Chip color="secondary" label={depositChainName} />
          </Grid>
        </Grid>
        <Grid container alignItems="flex-end" spacing={2}>
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
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <QRCode value={depositAddress} />
          </Grid>
          <Grid item xs={9}>
            <Alert variant="outlined" severity="info">
              Waiting for deposit!
            </Alert>
          </Grid>
          <Grid item xs={3}>
            <CircularProgress />
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Divider variant="middle" />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography gutterBottom variant="h6">
              Receiving On
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Chip color="primary" label={withdrawChainName} />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
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
        <Skeleton variant="rectangular" height={300} />
      </>
    )}
  </>
);

const DepositingState: FC<{
  depositChainName: string;
}> = ({ depositChainName }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Depositing Into
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="primary" label={depositChainName} />
      </Grid>
    </Grid>
    <Grid
      container
      spacing={3}
      alignItems="center"
      justifyContent="center"
      direction="column"
    >
      <Grid item>
        <img src={LoadingGif} alt="loading"></img>
      </Grid>
    </Grid>
    <Grid item xs={12}>
      <Alert variant="filled" severity="info">
        Detected deposit on-chain, depositing into state channel!
      </Alert>
    </Grid>
  </>
);

const TransferringState: FC<{
  depositChainName: string;
  withdrawChainName: string;
}> = ({ depositChainName, withdrawChainName }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Transferring From
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="secondary" label={depositChainName} />
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Transferring To
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="primary" label={withdrawChainName} />
      </Grid>
    </Grid>
    <Grid
      container
      spacing={3}
      alignItems="center"
      justifyContent="center"
      direction="column"
    >
      <Grid item>
        <img src={LoadingGif} alt="loading"></img>
      </Grid>
    </Grid>
    <Grid item xs={12}>
      <Alert variant="filled" severity="info">
        Transferring between state channels!
      </Alert>
    </Grid>
  </>
);

const WithdrawingState: FC<{
  withdrawChainName: string;
}> = ({ withdrawChainName }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Withdrawing To
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="primary" label={withdrawChainName} />
      </Grid>
    </Grid>
    <Grid
      container
      spacing={3}
      alignItems="center"
      justifyContent="center"
      direction="column"
    >
      <Grid item>
        <img src={LoadingGif} alt="loading"></img>
      </Grid>
    </Grid>
    <Grid item xs={12}>
      <Alert variant="filled" severity="info">
        Withdrawing funds back on-chain!
      </Alert>
    </Grid>
  </>
);

const CompleteState: FC<{
  withdrawTx: string;
  withdrawChainName: string;
  withdrawChainId: number;
  sentAmount: string;
}> = ({ withdrawTx, withdrawChainName, sentAmount, withdrawChainId }) => (
  <>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Finished Sending To
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="primary" label={withdrawChainName} />
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Amount Sent"
          defaultValue={sentAmount}
          InputProps={{
            readOnly: true,
          }}
          fullWidth
        />
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Withdrawal Tx
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Button
          variant="contained"
          href={getExplorerLinkForTx(withdrawChainId, withdrawTx)}
          target="_blank"
        >
          Link
        </Button>
      </Grid>
    </Grid>
  </>
);

const ErrorState: FC<{ error: Error; crossChainTransferId: string }> = ({
  error,
  crossChainTransferId,
}) => (
  <>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography gutterBottom variant="h5">
          {`Error transferring ${crossChainTransferId.substring(0, 5)}... - ${
            error.message
          }`}
        </Typography>
      </Grid>
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
    </Grid>
  </>
);
