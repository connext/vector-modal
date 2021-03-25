import 'react-app-polyfill/ie11';
import 'regenerator-runtime/runtime';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Magic } from 'magic-sdk';
import { providers } from 'ethers';

// Test key defaults to "rinkeby", live key defaults to "mainnet"

import { ConnextModal } from '@connext/vector-modal';

type LoginType = 'none' | 'metamask' | 'magic';
const magic = new Magic('pk_test_D646A81EA4676AB2', {
  network: 'rinkeby', // Supports "rinkeby", "ropsten", "kovan"
});

function App() {
  const [showModal, setShowModal] = React.useState(false);
  const [
    loginProvider,
    _setLoginProvider,
  ] = React.useState<providers.Web3Provider>();
  const [loginType, setLoginType] = React.useState<LoginType>('none');
  const [transferAmount, setTransferAmount] = React.useState<string>();

  const setLoginProvider = async (loginType: LoginType) => {
    let provider: providers.Web3Provider | undefined;
    if (loginType === 'metamask') {
      if (!(window as any).ethereum) {
        throw new Error('Web3 not available');
      }
      provider = (window as any).ethereum;
    } else if (loginType === 'magic') {
      provider = magic.rpcProvider as any;
    }
    _setLoginProvider(provider);
  };

  const handleLoginProvider = async () => {
    if (loginType === 'metamask') {
      const provider = new providers.Web3Provider(loginProvider as any);
      const accounts = await provider.send('eth_requestAccounts', []);
      console.log('accounts: ', accounts);
    } else if (loginType === 'magic') {
      await magic.auth.loginWithMagicLink({ email: 'rksethuram9@gmail.com' });
      const provider = new providers.Web3Provider(loginProvider as any);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('address: ', address);
    }
  };

  return (
    <>
      <div
        onChange={async (event) => {
          console.log('event: ', event.target);
          setLoginType((event.target as any).value);
          await setLoginProvider((event.target as any).value);
        }}
      >
        <input type="radio" value="metamask" name="loginType" /> Metamask
        <input type="radio" value="magic" name="loginType" /> Magic
        <input type="radio" value="none" name="loginType" defaultChecked /> None
      </div>
      <input
        type="number"
        defaultChecked
        onChange={(event) => setTransferAmount(event.target.value)}
      />{' '}
      Transfer Amount
      <br />
      <button
        onClick={async () => {
          try {
            await handleLoginProvider();
          } catch (e) {
            console.error('Error logging in: ', e);
            return;
          }
          setShowModal(true);
        }}
      >
        Show Modal
      </button>
      <ConnextModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onReady={(params) => console.log('MODAL IS READY =======>', params)}
        onFinished={(params) => console.log('On finish ==>', params)}
        // onSwap={(params) => {
        //   console.log('onSwap params: ', params);
        // throw new Error(params);
        // }}
        transferAmount={transferAmount}
        withdrawalAddress={'0x75e4DD0587663Fce5B2D9aF7fbED3AC54342d3dB'}
        loginProvider={loginProvider}
        injectedProvider={loginProvider}
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
