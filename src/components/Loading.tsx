import React, { FC } from 'react';
import { Typography, Grid, CircularProgress } from '@material-ui/core';

interface LoadingProps {
  initializing: boolean;
  message: string;
  tip: string;
}

const Loading: FC<LoadingProps> = props => {
  //   const [imageLoaded, setImageLoaded] = useState(true);
  return (
    <>
      {props.initializing && (
        <>
          <Grid container direction="row" justifyContent="center">
            <Typography
              variant="h5"
              style={{
                paddingBottom: '16px',
              }}
            >
              Setting Things Up
            </Typography>
          </Grid>
          <Grid container direction="row" justifyContent="center">
            <CircularProgress size="3rem" color="inherit" />
          </Grid>

          <Grid container direction="row" justifyContent="center">
            <Typography
              variant="subtitle2"
              style={{
                marginTop: '16px',
                fontSize: '14px',
                paddingBottom: '16px',
              }}
            >
              {props.message}
            </Typography>

            {/* <Grid item xs={12}>
              <Typography variant="subtitle2" style={{ fontSize: '11px' }}>
                {props.tip}
              </Typography>
            </Grid> */}
          </Grid>
        </>
      )}
    </>
  );
};

export default Loading;
