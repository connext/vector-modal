import { render } from 'hybrids';

import React, { FC } from 'react';
import ReactDOM from 'react-dom';

import ConnextModal from './Modal';

interface ModalProps {
  routerPublicIdentifier: string;
  withdrawalAddress: string;
  depositChainId: number;
  depositAssetId: string;
  depositChainProvider: string;
  withdrawChainId: number;
  withdrawAssetId: string;
  withdrawChainProvider: string;
  transferAmount: string;
}

const Modal: FC<ModalProps> = props => {
  const [showModal, setShowModal] = React.useState(false);
  console.log(
    props.withdrawalAddress,
    props.routerPublicIdentifier,
    props.depositChainId,
    props.depositAssetId,
    props.depositChainProvider,
    props.withdrawChainId,
    props.withdrawAssetId,
    props.withdrawChainProvider,
    props.transferAmount
  );

  return (
    <>
      <button onClick={() => setShowModal(true)}>Show Modal</button>
      <ConnextModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onReady={params => console.log('MODAL IS READY =======>', params)}
        withdrawalAddress={props.withdrawalAddress}
        injectedProvider={(window as any).ethereum}
        routerPublicIdentifier={props.routerPublicIdentifier}
        depositChainId={props.depositChainId}
        depositAssetId={props.depositAssetId}
        depositChainProvider={props.depositChainProvider}
        withdrawChainId={props.withdrawChainId}
        withdrawAssetId={props.withdrawAssetId}
        withdrawChainProvider={props.withdrawChainProvider}
      />
    </>
  );
};

// This function creates update callback, which uses react-dom
// to render content in shadowRoot of the custom element.
// For production use it should support ShadyCSS polyfill
// to properly distribute styles in custom element rendered by React
function reactify(fn): hybrids.Descriptor<HTMLElement> {
  return render(
    host => {
      const Component = fn(host);
      return (host, target) => ReactDOM.render(Component, target);
    },
    { shadowRoot: false }
  );
}

export interface WebModalProps {
  routeridentifier: string;
  wcaddress: string;
  dchain: number;
  dasset: string;
  dprovider: string;
  wchain: number;
  wasset: string;
  wprovider: string;
  amount: string;
}

export default {
  routeridentifier: '0',
  wcaddress: '0',
  dchain: 0,
  dasset: '0',
  dprovider: '0',
  wchain: 0,
  wasset: '0',
  wprovider: '0',
  amount: '0',
  render: reactify(
    ({
      routeridentifier,
      wcaddress,
      dchain,
      dasset,
      dprovider,
      wchain,
      wasset,
      wprovider,
      amount,
    }: WebModalProps) => (
      <Modal
        routerPublicIdentifier={routeridentifier}
        withdrawalAddress={wcaddress}
        depositChainId={dchain}
        depositAssetId={dasset}
        depositChainProvider={dprovider}
        withdrawChainId={wchain}
        withdrawAssetId={wasset}
        withdrawChainProvider={wprovider}
        transferAmount={amount}
      />
    )
  ),
};
