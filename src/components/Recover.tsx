import React, { FC, useState } from 'react';
import {
  Grid,
  Button,
  Typography,
  TextField,
  CircularProgress,
} from '@material-ui/core';

import { CheckCircle, AlertCircle } from 'react-feather';
import { makeStyles } from '@material-ui/core/styles';

import { BigNumber, constants } from 'ethers';
import { FullChannelState } from '@connext/vector-types';
import { getBalanceForAssetId } from '@connext/vector-utils';
import { getExplorerLinkForTx } from '../utils';
import { BrowserNode } from '@connext/vector-browser-node';

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

const Recover: FC<{
  depositAddress?: string;
  depositChainId: number;
  node: BrowserNode;
}> = ({ depositAddress, depositChainId, node }) => {
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
    const deposit = await node.reconcileDeposit({
      assetId,
      channelAddress: depositAddress!,
    });
    if (deposit.isError) {
      setStatus('Error');
      setErrorMessage(deposit.getError()!.message);
      throw deposit.getError();
    }

    const updatedChannel = await node.getStateChannel({
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

    const withdrawRes = await node.withdraw({
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
            <CheckCircle color="secondary" fontSize="large" />
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
            <AlertCircle fontSize="large" color="error" />
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

export default Recover;
