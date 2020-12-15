import { BrowserNode } from '@connext/vector-browser-node';
import {
  Dialog,
  DialogTitle,
  Grid,
  makeStyles,
  Tooltip,
  Typography,
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
} from 'ethers';
import { EngineEvents, ERC20Abi } from '@connext/vector-types';

// @ts-ignore
import LoadingGif from '../assets/loading.gif';

const PROD_ROUTER_IDENTIFIER =
  'vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q';

const PROD_IFRAME_WALLET = 'https://wallet.connext.network';

const routerPublicIdentifier =
  process.env.REACT_APP_ROUTER_IDENTIFIER || PROD_ROUTER_IDENTIFIER;

const iframeSrc = process.env.REACT_APP_IFRAME_SRC || PROD_IFRAME_WALLET;

const TRANSFER_STATES = {
  INITIAL: 'INITIAL',
  DEPOSITING: 'DEPOSITING',
  TRANSFERRING: 'TRANSFERRING',
  WITHDRAWING: 'WITHDRAWING',
  COMPLETE: 'COMPLETE',
} as const;
export type TransferStates = keyof typeof TRANSFER_STATES;

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
    padding: '2rem',
  },
}));

type ConnextModalProps = {
  showModal: boolean;
  depositChainId: number;
  depositAssetId: string;
  withdrawChainId: number;
  withdrawAssetId: string;
  withdrawalAddress: string;
};

export const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  depositChainId,
  depositAssetId,
  withdrawChainId,
  withdrawAssetId,
  withdrawalAddress,
}) => {
  const classes = useStyles();
  const [depositAddress, setDepositAddress] = useState<string>();
  const [transferState, setTransferState] = useState<TransferStates>(
    TRANSFER_STATES.INITIAL
  );
  const [withdrawTx, setWithdrawTx] = useState<string>();

  useEffect(() => {
    const init = async () => {
      const ethProvidersOverrides = JSON.parse(
        process.env.REACT_APP_ETH_PROVIDERS || '{}'
      );
      const _ethProviders = [depositChainId, withdrawChainId].reduce(
        (
          _ethProviders: { [chainId: number]: providers.BaseProvider },
          chainId
        ) => {
          if (ethProvidersOverrides[chainId]) {
            _ethProviders[chainId] = new providers.JsonRpcProvider(
              ethProvidersOverrides[chainId]
            );
          } else {
            _ethProviders[chainId] = getDefaultProvider(chainId as any);
          }
          return _ethProviders;
        },
        {}
      );
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
          const transferPromise = browserNode.crossChainTransfer({
            amount: transferAmount.toString(),
            fromAssetId: depositAssetId,
            fromChainId: depositChainId,
            toAssetId: withdrawAssetId,
            toChainId: withdrawChainId,
            reconcileDeposit: true,
            withdrawalAddress,
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

          const transferEvent = await new Promise(res => {
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
          setTransferState(TRANSFER_STATES.WITHDRAWING);

          const crossChainTransfer = await transferPromise;
          console.log('crossChainTransfer: ', crossChainTransfer);
          setWithdrawTx(crossChainTransfer.withdrawalTx);
          setTransferState(TRANSFER_STATES.COMPLETE);
        }
      });
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Dialog open={showModal} fullWidth={true}>
      <div
        className={classes.root}
        style={{
          backgroundColor:
            transferState === TRANSFER_STATES.INITIAL ? undefined : '#fbd116',
        }}
      >
        {transferState === TRANSFER_STATES.INITIAL && (
          <InitialState
            depositAddress={depositAddress}
            depositChainId={depositChainId}
            withdrawChainId={withdrawChainId}
            withdrawalAddress={withdrawalAddress}
          />
        )}
        {transferState === TRANSFER_STATES.DEPOSITING && (
          <DepositingState depositChainId={depositChainId} />
        )}
        {transferState === TRANSFER_STATES.TRANSFERRING && (
          <TransferringState
            depositChainId={depositChainId}
            withdrawChainId={withdrawChainId}
          />
        )}
        {transferState === TRANSFER_STATES.WITHDRAWING && (
          <WithdrawingState withdrawChainId={withdrawChainId} />
        )}
        {transferState === TRANSFER_STATES.COMPLETE && (
          <CompleteState withdrawTx={withdrawTx!} />
        )}
      </div>
    </Dialog>
  );
};

const InitialState: FC<{
  depositAddress?: string;
  depositChainId: number;
  withdrawChainId: number;
  withdrawalAddress: string;
}> = ({
  depositAddress,
  depositChainId,
  withdrawChainId,
  withdrawalAddress,
}) => (
  <>
    <DialogTitle>Deposit Address</DialogTitle>
    {depositAddress && (
      <Grid
        container
        spacing={3}
        alignItems="center"
        justifyContent="center"
        direction="column"
      >
        <Grid item>
          <QRCode value={depositAddress} />
        </Grid>
        <Grid item>
          <Grid
            container
            spacing={3}
            alignItems="center"
            justifyContent="center"
          >
            <Tooltip title="Copy" placement="right">
              <Chip
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
        <Grid item>
          <Typography>
            Send funds on {depositChainId} to instantly transfer to{' '}
            {withdrawalAddress} on {withdrawChainId}
          </Typography>
        </Grid>
      </Grid>
    )}
  </>
);

const DepositingState: FC<{
  depositChainId: number;
}> = ({ depositChainId }) => (
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
      <Grid item>
        <Typography>Depositing into channel on {depositChainId}</Typography>
      </Grid>
    </Grid>
  </>
);

const TransferringState: FC<{
  depositChainId: number;
  withdrawChainId: number;
}> = ({ depositChainId, withdrawChainId }) => (
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
      <Grid item>
        <Typography>
          Transferring from {depositChainId} to {withdrawChainId}
        </Typography>
      </Grid>
    </Grid>
  </>
);

const WithdrawingState: FC<{
  withdrawChainId: number;
}> = ({ withdrawChainId }) => (
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
      <Grid item>
        <Typography>Withdrawing to {withdrawChainId}</Typography>
      </Grid>
    </Grid>
  </>
);

const CompleteState: FC<{
  withdrawTx: string;
}> = ({ withdrawTx }) => (
  <>
    <DialogTitle>Transfer Complete</DialogTitle>
    <Grid
      container
      spacing={3}
      alignItems="center"
      justifyContent="center"
      direction="column"
    >
      <Grid item>
        <Typography>Successfully withdrew! Tx hash: {withdrawTx}</Typography>
      </Grid>
    </Grid>
  </>
);
