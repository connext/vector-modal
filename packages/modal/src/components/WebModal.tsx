// import { render } from 'hybrids';

// import React, { FC } from 'react';
// import ReactDOM from 'react-dom';

// import ConnextModal from './Modal';

// interface ModalProps {
//   routerPublicIdentifier: string;
//   withdrawalAddress: string;
//   depositChainId: number;
//   depositAssetId: string;
//   depositChainProvider: string;
//   withdrawChainId: number;
//   withdrawAssetId: string;
//   withdrawChainProvider: string;
//   transferAmount?: string;
//   iframeSrcOverride?: string;
//   injectedProvider?: any;
//   loginProvider?: any;
// }

// const Modal: FC<ModalProps> = props => {
//   const [showModal, setShowModal] = React.useState(false);

//   return (
//     <>
//       <button onClick={() => setShowModal(true)}>Show Modal</button>
//       <ConnextModal
//         showModal={showModal}
//         onClose={() => setShowModal(false)}
//         withdrawalAddress={props.withdrawalAddress}
//         routerPublicIdentifier={props.routerPublicIdentifier}
//         depositChainId={props.depositChainId}
//         depositAssetId={props.depositAssetId}
//         depositChainProvider={props.depositChainProvider}
//         withdrawChainId={props.withdrawChainId}
//         withdrawAssetId={props.withdrawAssetId}
//         withdrawChainProvider={props.withdrawChainProvider}
//         transferAmount={props.transferAmount}
//         // provider
//         iframeSrcOverride={props.iframeSrcOverride}
//         injectedProvider={props.injectedProvider}
//         loginProvider={props.loginProvider}
//         // callback function
//         onReady={params => console.log('MODAL IS READY =======>', params)}
//         onDepositTxCreated={params => console.log('DepositTx created:', params)}
//         onWithdrawalTxCreated={params => console.log('WithdrawalTx :', params)}
//         onFinished={params => console.log('Finished:', params)}
//       />
//     </>
//   );
// };

// // This function creates update callback, which uses react-dom
// // to render content in shadowRoot of the custom element.
// // For production use it should support ShadyCSS polyfill
// // to properly distribute styles in custom element rendered by React

// // @ts-ignore
// function reactify(fn): hybrids.Descriptor<HTMLElement> {
//   return render(
//     host => {
//       const Component = fn(host);
//       return target => ReactDOM.render(Component, target);
//     },
//     { shadowRoot: false }
//   );
// }

// export interface WebModalProps {
//   router_public_identifier: string;
//   withdrawal_address: string;
//   deposit_chain_id: number;
//   deposit_asset_id: string;
//   deposit_chain_provider: string;
//   withdraw_chain_id: number;
//   withdraw_asset_id: string;
//   withdraw_chain_provider: string;
//   transfer_amount?: string;
//   iframe_src?: string;
//   injected_provider?: any;
//   login_provider?: any;
// }

// export default {
//   router_public_identifier: '0',
//   withdrawal_address: '0',
//   deposit_chain_id: 0,
//   deposit_asset_id: '0',
//   deposit_chain_provider: '0',
//   withdraw_chain_id: 0,
//   withdraw_asset_id: '0',
//   withdraw_chain_provider: '0',
//   transfer_amount: '0',
//   iframe_src: undefined,
//   injected_provider: undefined,
//   login_provider: undefined,
//   render: reactify(
//     ({
//       router_public_identifier,
//       withdrawal_address,
//       deposit_chain_id,
//       deposit_asset_id,
//       deposit_chain_provider,
//       withdraw_chain_id,
//       withdraw_asset_id,
//       withdraw_chain_provider,
//       transfer_amount,
//       iframe_src,
//       injected_provider,
//       login_provider,
//     }: WebModalProps) => (
//       <Modal
//         routerPublicIdentifier={router_public_identifier}
//         withdrawalAddress={withdrawal_address}
//         depositChainId={deposit_chain_id}
//         depositAssetId={deposit_asset_id}
//         depositChainProvider={deposit_chain_provider}
//         withdrawChainId={withdraw_chain_id}
//         withdrawAssetId={withdraw_asset_id}
//         withdrawChainProvider={withdraw_chain_provider}
//         transferAmount={transfer_amount}
//         iframeSrcOverride={iframe_src}
//         injectedProvider={injected_provider}
//         loginProvider={login_provider}
//       />
//     )
//   ),
// };
