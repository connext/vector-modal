import "react-app-polyfill/ie11";
import "regenerator-runtime/runtime";
import * as React from "react";
import * as ReactDOM from "react-dom";

// Test key defaults to "rinkeby", live key defaults to "mainnet"

import Modal from "./components/Modal";

function App() {
  return (
    <>
      <Modal />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
