import 'react-app-polyfill/ie11';
import 'regenerator-runtime/runtime';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { config } from 'dotenv';

import { ConnextModal } from '../.';

config();

function App() {
  const [showModal, setShowModal] = React.useState(false);
  const toggle = () => setShowModal(!showModal);
  return (
    <>
      <button onClick={toggle}>Hello World</button>
      <ConnextModal
        showModal={showModal}
        depositAssetId={'0x000000000000000000000000000000000000000000'}
        depositChainId={1337}
        withdrawAssetId={'0x000000000000000000000000000000000000000000'}
        withdrawChainId={1338}
        withdrawalAddress={'0x000000000000000000000000000000000000000000'}
      />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
