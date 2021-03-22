import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { constants } from 'ethers';
import { ConnextModal } from '../src';

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <ConnextModal
        showModal={true}
        depositChainId={1337}
        depositAssetId={constants.AddressZero}
        withdrawAssetId={constants.AddressZero}
        withdrawChainId={1338}
        withdrawalAddress={constants.AddressZero}
        onClose={() => false}
        routerPublicIdentifier="vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q"
        depositChainProvider="http://localhost:8545"
        withdrawChainProvider="http://localhost:8546"
      />,
      div
    );
    ReactDOM.unmountComponentAtNode(div);
  });
});
