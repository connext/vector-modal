import React, { FC } from 'react';
import { Typography } from '@material-ui/core';

import './style.module.scss';
// @ts-ignore
import LoadingGif from '../../assets/loading.gif';

interface LoadingProps {
  initializing: boolean;
  message: string;
}

const Loading: FC<LoadingProps> = props => {
  //   const [imageLoaded, setImageLoaded] = useState(true);
  return (
    <div className={props.initializing ? 'Loading' : 'Loading Loading-fadeout'}>
      <div
        className="Loading-Circle"
        // style={{ display: imageLoaded ? "block" : "none" }}
      >
        <img src={LoadingGif} alt="loading"></img>
      </div>
      <Typography variant="subtitle2" className="Loading-Message">
        {props.message}
      </Typography>
    </div>
  );
};

export default Loading;
