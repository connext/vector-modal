import React, { FC } from 'react';
import { Grid, Button, Typography, TextField, Link } from '@material-ui/core';
import { CheckCircle } from 'react-feather';
import {
  getExplorerLinkForTx,
  getExplorerLinkForAsset,
  getAssetName,
} from '../utils';
import { utils } from 'ethers';

export interface SuccessScreenProps {
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

const SuccessScreen: FC<SuccessScreenProps> = props => {
  const {
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
  } = props;

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
            rel="noopener"
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
            size="medium"
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

export default SuccessScreen;
