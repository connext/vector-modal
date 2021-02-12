import React, { FC } from 'react';
import { ERROR_STATES, ErrorStates } from '../constants';
import { Grid, Button, Typography } from '@material-ui/core';
import { constants } from 'ethers';

import { AlertCircle } from 'react-feather';

export interface ErrorStateProps {
  error: Error;
  errorState: ErrorStates;
  crossChainTransferId: string;
  styles: string;
  retry: () => void;
}

const ErrorScreen: FC<ErrorStateProps> = props => {
  const { error, errorState, crossChainTransferId, styles, retry } = props;
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

export default ErrorScreen;
