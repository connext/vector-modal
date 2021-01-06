import 'react-app-polyfill/ie11';
import 'regenerator-runtime/runtime';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ConnextModal } from '../';

function App() {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Hello World</button>
      <ConnextModal
        showModal={showModal}
        // prod config
        // routerPublicIdentifier="vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q"
        // depositAssetId={'0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa'}
        // depositChainId={5}
        // withdrawAssetId={'0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1'}
        // withdrawChainId={80001}
        // local config
        routerPublicIdentifier="vector8Uz1BdpA9hV5uTm6QUv5jj1PsUyCH8m8ciA94voCzsxVmrBRor"
        depositAssetId={'0x0000000000000000000000000000000000000000'}
        depositChainId={1337}
        depositChainProvider="http://localhost:8545"
        withdrawAssetId={'0x0000000000000000000000000000000000000000'}
        withdrawChainId={1338}
        withdrawChainProvider="http://localhost:8546"
        withdrawalAddress={'0x75e4DD0587663Fce5B2D9aF7fbED3AC54342d3dB'}
        onClose={() => setShowModal(false)}
        onReady={params => console.log('MODAL IS READY =======>', params)}
      />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
