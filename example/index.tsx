import 'react-app-polyfill/ie11';
import 'regenerator-runtime/runtime';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Magic } from 'magic-sdk';
import { ethers } from 'ethers';

// Test key defaults to "rinkeby", live key defaults to "mainnet"

import { ConnextModal } from '../';

const originalMessage = {
  types: {
    EIP712Domain: [
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'version',
        type: 'string',
      },
      {
        name: 'verifyingContract',
        type: 'address',
      },
    ],
    Greeting: [
      {
        name: 'contents',
        type: 'string',
      },
    ],
  },
  primaryType: 'Greeting',
  domain: {
    name: 'Vector',
    version: '1',
    verifyingContract: '0xE0cef4417a772512E6C95cEf366403839b0D6D6D',
  },
  message: {
    contents: 'Welcome to Connext. Please confirm signature to sign in!',
  },
};
const method = 'eth_signTypedData_v4';

function App() {
  const [showModal, setShowModal] = React.useState(false);

  const loginWithMagicLink = async () => {
    const magic = new Magic('pk_test_D646A81EA4676AB2', {
      network: 'rinkeby', // Supports "rinkeby", "ropsten", "kovan"
    });
    const provider = new ethers.providers.Web3Provider(
      magic.rpcProvider as any
    );
    await magic.auth.loginWithMagicLink({ email: 'rksethuram9@gmail.com' });
    const signer = provider.getSigner();

    const fromAddress = await signer.getAddress();
    console.log('fromAddress: ', fromAddress);
    const params = [fromAddress, originalMessage];

    const signedMessage = await signer.provider.send(method, params);
    console.log('signedMessage: ', signedMessage);
  };

  const loginWithMetamask = async () => {
    if ((window as any).ethereum) {
      await (window as any).ethereum.enable;
    }

    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    const signer = provider.getSigner();

    const fromAddress = await signer.getAddress();
    console.log('fromAddress: ', fromAddress);
    const params = [fromAddress, JSON.stringify(originalMessage)];

    const signedMessage = await signer.provider.send(method, params);
    console.log('signedMessage: ', signedMessage);
  };

  return (
    <>
      <button onClick={loginWithMagicLink}>Login with Magic Link</button>
      <button onClick={loginWithMetamask}>Login with Metamask</button>
      <button onClick={() => setShowModal(true)}>Show Modal</button>
      <ConnextModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onReady={params => console.log('MODAL IS READY =======>', params)}
        withdrawalAddress={'0x75e4DD0587663Fce5B2D9aF7fbED3AC54342d3dB'}
        // injectedProvider={(window as any).ethereum}
        // prod config
        routerPublicIdentifier="vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q"
        depositAssetId={'0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa'}
        depositChainProvider="https://goerli.infura.io/v3/af2f28bdb95d40edb06226a46106f5f9"
        withdrawAssetId={'0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1'}
        withdrawChainProvider="https://rpc-mumbai.matic.today"
        // local config
        // routerPublicIdentifier="vector8Uz1BdpA9hV5uTm6QUv5jj1PsUyCH8m8ciA94voCzsxVmrBRor"
        // depositAssetId={'0x9FBDa871d559710256a2502A2517b794B482Db40'}
        // depositChainProvider="http://localhost:8545"
        // withdrawAssetId={'0x9FBDa871d559710256a2502A2517b794B482Db40'}
        // withdrawChainProvider="http://localhost:8546"
      />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
