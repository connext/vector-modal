import { BrowserNode } from '@connext/vector-browser-node';
import {
  Dialog,
  Grid,
  makeStyles,
  Tooltip,
  Divider,
  Button,
  Typography,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
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
import {
  ConditionalTransferCreatedPayload,
  EngineEvents,
  ERC20Abi,
} from '@connext/vector-types';

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

  const [transferState, setTransferState] = useState<TransferStates>(
    TRANSFER_STATES.INITIAL
  );
  const [withdrawTx, setWithdrawTx] = useState<string>();

  useEffect(() => {
    const init = async () => {
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
      const _ethProviders: { [chainId: number]: providers.BaseProvider } = {};
      for (const chainId of [depositChainId, withdrawChainId]) {
        if (ethProvidersOverrides[chainId]) {
          _ethProviders[chainId] = new providers.JsonRpcProvider(
            ethProvidersOverrides[chainId]
          );
        } else {
          const providerUrl = getProviderUrlForChain(chainId);
          if (providerUrl) {
            _ethProviders[chainId] = new providers.JsonRpcProvider(providerUrl);
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
      await browserNode.init();
      console.log('INITIALIZED BROWSER NODE');
      const depositChannelRes = await browserNode.getStateChannelByParticipants(
        {
          chainId: depositChainId,
          counterparty: routerPublicIdentifier,
        }
      );
      if (depositChannelRes.isError) {
        throw depositChannelRes.getError();
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
        throw withdrawChannelRes.getError();
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

      const startingBalance = await getAssetBalance(
        depositChainId,
        depositAssetId,
        _depositAddress
      );
      console.log(
        `Starting balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${startingBalance.toString()}`
      );
      _ethProviders[depositChainId].on('block', async blockNumber => {
        console.log('New blockNumber: ', blockNumber);
        const updatedBalance = await getAssetBalance(
          depositChainId,
          depositAssetId,
          _depositAddress
        );
        console.log(
          `Updated balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${updatedBalance.toString()}`
        );
        if (updatedBalance.gt(startingBalance)) {
          const transferAmount = updatedBalance.sub(startingBalance);
          setTransferState(TRANSFER_STATES.DEPOSITING);
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
            })
            .then(crossChainTransfer => {
              console.log('crossChainTransfer: ', crossChainTransfer);
              setWithdrawTx(crossChainTransfer.withdrawalTx);
              setTransferState(TRANSFER_STATES.COMPLETE);
            })
            .catch(e => {
              console.error('Error in crossChainTransfer: ', e);
              setTransferState(TRANSFER_STATES.ERROR);
            });

          const depositEvent = await new Promise(res => {
            browserNode.on(EngineEvents.DEPOSIT_RECONCILED, data => {
              if (data.channelAddress === depositChannel.channelAddress) {
                res(data);
              }
            });
          });
          console.log(
            'Received EngineEvents.DEPOSIT_RECONCILED: ',
            depositEvent
          );
          setTransferState(TRANSFER_STATES.TRANSFERRING);

          const transferEvent = await new Promise<
            ConditionalTransferCreatedPayload
          >(res => {
            browserNode.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, data => {
              console.log(
                'EngineEvents.CONDITIONAL_TRANSFER_RESOLVED ====> data: ',
                data
              );
              if (data.channelAddress === withdrawChannel.channelAddress) {
                res(data);
              }
            });
          });
          console.log(
            'Received EngineEvents.CONDITIONAL_TRANSFER_RESOLVED: ',
            transferEvent
          );
          setSentAmount(
            utils.formatEther(transferEvent.channelBalance.amount[1])
          );
          setTransferState(TRANSFER_STATES.WITHDRAWING);
        }
      });
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
          {transferState === TRANSFER_STATES.INITIAL && (
            <InitialState
              depositAddress={depositAddress}
              depositChainName={depositChainName}
              withdrawChainName={withdrawChainName}
              withdrawalAddress={withdrawalAddress}
            />
          )}
          {transferState === TRANSFER_STATES.DEPOSITING && (
            <DepositingState depositChainName={depositChainName} />
          )}
          {transferState === TRANSFER_STATES.TRANSFERRING && (
            <TransferringState
              depositChainName={depositChainName}
              withdrawChainName={withdrawChainName}
            />
          )}
          {transferState === TRANSFER_STATES.WITHDRAWING && (
            <WithdrawingState withdrawChainName={withdrawChainName} />
          )}
          {transferState === TRANSFER_STATES.COMPLETE && (
            <CompleteState
              withdrawChainName={withdrawChainName}
              withdrawTx={withdrawTx!}
              sentAmount={sentAmount}
              withdrawChainId={withdrawChainId}
            />
          )}
          {transferState === TRANSFER_STATES.ERROR && <ErrorState />}
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

const InitialState: FC<{
  depositAddress?: string;
  depositChainName: string;
  withdrawChainName: string;
  withdrawalAddress: string;
}> = ({
  depositAddress,
  depositChainName,
  withdrawChainName,
  withdrawalAddress,
}) => (
  <>
    {depositAddress && (
      <>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography gutterBottom variant="h6">
              Send Funds To
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Chip color="secondary" label={depositChainName} />
          </Grid>
        </Grid>
        <Grid container alignItems="flex-end" spacing={2}>
          <Grid item xs={12}>
            <QRCode value={depositAddress} />
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="Copy" placement="right">
              <Chip
                size="medium"
                variant="outlined"
                label={depositAddress}
                onClick={event => {
                  console.log((event.target as any).innerText);
                  navigator.clipboard.writeText(
                    (event.target as any).innerText
                  );
                }}
              />
            </Tooltip>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Divider variant="middle" />
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
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Chip size="medium" variant="outlined" label={withdrawalAddress} />
          </Grid>
        </Grid>
      </>
    )}
  </>
);

const DepositingState: FC<{
  depositChainName: string;
}> = ({ depositChainName }) => (
  <>
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
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Detected Deposit Into
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="primary" label={depositChainName} />
      </Grid>
    </Grid>
  </>
);

const TransferringState: FC<{
  depositChainName: string;
  withdrawChainName: string;
}> = ({ depositChainName, withdrawChainName }) => (
  <>
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
  </>
);

const WithdrawingState: FC<{
  withdrawChainName: string;
}> = ({ withdrawChainName }) => (
  <>
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
  </>
);

const CompleteState: FC<{
  withdrawTx: string;
  withdrawChainName: string;
  withdrawChainId: number;
  sentAmount: string;
}> = ({ withdrawTx, withdrawChainName, sentAmount, withdrawChainId }) => (
  <>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography gutterBottom variant="h5">
          Transfer Complete
        </Typography>
      </Grid>
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Sent Funds To
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip color="primary" label={withdrawChainName} />
      </Grid>
    </Grid>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography gutterBottom variant="h6">
          Amount Sent
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Chip label={sentAmount} variant="outlined" />
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

const ErrorState: FC = () => (
  <>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography gutterBottom variant="h5">
          Error Transferring :(
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
