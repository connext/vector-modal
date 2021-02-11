import { render } from 'hybrids';

import React, { FC } from 'react';
import ReactDOM from 'react-dom';

import ConnextModal from './Modal';

interface ModalProps {
  // routerPublicIdentifier: string;
  // withdrawalAddress: string;
  // depositAssetId: string;
  // depositChainProvider: string;
  // withdrawAssetId: string;
  // withdrawChainProvider: string;
  transferAmount: string;
}

const Modal: FC<ModalProps> = props => {
  const [showModal, setShowModal] = React.useState(false);
  console.log(
    // props.withdrawalAddress,
    // props.routerPublicIdentifier,
    // props.depositAssetId,
    // props.depositChainProvider,
    // props.withdrawAssetId,
    // props.withdrawChainProvider,
    props.transferAmount
  );

  return (
    <>
      <button onClick={() => setShowModal(true)}>Show Modal</button>
      <ConnextModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onReady={params => console.log('MODAL IS READY =======>', params)}
        // withdrawalAddress={props.withdrawalAdress}
        // injectedProvider={(window as any).ethereum}
        // routerPublicIdentifier={props.routerPublicIdentifier}
        // depositAssetId={props.depositAssetId}
        // depositChainProvider={props.depositChainProvider}
        // withdrawAssetId={props.withdrawAssetId}
        // withdrawChainProvider={props.withdrawChainProvider}
        // prod config
        // transferAmount={props.transferAmount}
        withdrawalAddress={'0x75e4DD0587663Fce5B2D9aF7fbED3AC54342d3dB'}
        injectedProvider={(window as any).ethereum}
        routerPublicIdentifier="vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q"
        depositChainId={5}
        depositAssetId={'0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa'}
        depositChainProvider="https://goerli.infura.io/v3/56d8d68b920244ebac88e87388ba298a"
        withdrawChainId={80001}
        withdrawAssetId={'0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1'}
        withdrawChainProvider="https://rpc-mumbai.matic.today"
        transferAmount="0.01"
        // local config
        // routerPublicIdentifier="vector8Uz1BdpA9hV5uTm6QUv5jj1PsUyCH8m8ciA94voCzsxVmrBRor"
        // depositAssetId={'0x9FBDa871d559710256a2502A2517b794B482Db40'}
        // depositChainProvider="http://localhost:8545"
        // withdrawAssetId={'0x9FBDa871d559710256a2502A2517b794B482Db40'}
        // withdrawChainProvider="http://localhost:8546"
      />
    </>
  );
};

// This function creates update callback, which uses react-dom
// to render content in shadowRoot of the custom element.
// For production use it should support ShadyCSS polyfill
// to properly distribute styles in custom element rendered by React
function reactify(fn) {
  return render(
    host => {
      const Component = fn(host);
      return (host, target) => ReactDOM.render(Component, target);
    },
    { shadowRoot: false }
  );
}

export default {
  // routerPublicIdentifier: '0',
  // withdrawalAddress: '0',
  // depositAssetId: '0',
  // depositChainProvider: '0',
  // withdrawAssetId: '0',
  // withdrawChainProvider: '0',
  transferAmount: '0',
  render: reactify(({ // routerPublicIdentifier,
    // withdrawalAddress,
    // depositAssetId,
    // depositChainProvider,
    // withdrawAssetId,
    // withdrawChainProvider,
    transferAmount }) => (
    <Modal
      // routerPublicIdentifier={routerPublicIdentifier}
      // withdrawalAddress={withdrawalAddress}
      // depositAssetId={depositAssetId}
      // depositChainProvider={depositChainProvider}
      // withdrawAssetId={withdrawAssetId}
      // withdrawChainProvider={withdrawChainProvider}
      transferAmount={transferAmount}
    />
  )),
};
