import React, { FC } from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
// @ts-ignore
import LoadingGif from '../assets/loading.gif';

interface LoadingProps {
  initializing: boolean;
  message: string;
  tip: string;
}

const Loading: FC<LoadingProps> = props => {
  //   const [imageLoaded, setImageLoaded] = useState(true);
  return (
    <>
      {props.initializing ? (
        <>
          <Load>
            <LoadingCircle
            // style={{ display: imageLoaded ? "block" : "none" }}
            >
              <img
                src={LoadingGif}
                alt="loading"
                style={{ width: '100%', height: '100%' }}
              ></img>
            </LoadingCircle>
            <Typography
              variant="subtitle2"
              style={{
                marginTop: '24px',
                fontSize: '14px',
                paddingBottom: '16px',
              }}
            >
              {props.message}
            </Typography>
            <Typography variant="subtitle2" style={{ fontSize: '11px' }}>
              {props.tip}
            </Typography>
          </Load>
        </>
      ) : (
        <>
          <LoadingFadeout>
            <LoadingCircle
            // style={{ display: imageLoaded ? "block" : "none" }}
            >
              <img
                src={LoadingGif}
                alt="loading"
                style={{ width: '100%', height: '100%' }}
              ></img>
            </LoadingCircle>
            <Typography
              variant="subtitle2"
              style={{ marginTop: '24px', fontSize: '14px' }}
            >
              {props.message}
            </Typography>
          </LoadingFadeout>
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
