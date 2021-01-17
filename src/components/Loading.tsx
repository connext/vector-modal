import React, { FC } from 'react';
import { Typography, Grid, CircularProgress } from '@material-ui/core';
import styled from 'styled-components';

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

const Load = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(244, 245, 247, 0.8);
  z-index: 999;
`;

const LoadingFadeout = styled(Load)`
  -moz-animation-name: fadeOut;
  -webkit-animation-name: fadeOut;
  -ms-animation-name: fadeOut;
  animation-name: fadeOut;
  -moz-animation-duration: 0.5s;
  -webkit-animation-duration: 0.5s;
  -ms-animation-duration: 0.5s;
  animation-duration: 0.5s;
  -moz-animation-fill-mode: forwards;
  -webkit-animation-fill-mode: forwards;
  -ms-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
`;

const LoadingCircle = styled.div`
  height: 96px;
  width: 96px;
  border-radius: 64px;
  background-color: #fcd116;
  overflow: hidden;
`;
