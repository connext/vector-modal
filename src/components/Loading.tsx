import React, { useState } from "react";
import "../styles/Loading"
// @ts-ignore
import LoadingGif from '../assets/loading.gif';

export default function Loading({ initializing, message }) {
  const [imageLoaded, setImageLoaded] = useState(true);
  return (
    <div className={initializing ? "Loading" : "Loading Loading-fadeout"}>
      <div
        className="Loading-Circle"
        // style={{ display: imageLoaded ? "block" : "none" }}
      >
        <img src={LoadingGif} alt="loading"></img>
      </div>
      <div className="Loading-Message">{message}</div>
    </div>
  );
}
