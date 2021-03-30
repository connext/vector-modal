import { BrowserNode, CHAIN_DETAIL, ConnextSdk, SetupParamsSchema } from '../src';
import { expect } from 'chai';
import Sinon from 'sinon';
import { mkPublicIdentifier, mkAddress } from '@connext/vector-utils';
import * as helpers from '../src/utils/helpers';
import * as connextUtils from '../src/utils/connext';

import { env } from './env';
import { constants } from 'ethers';

describe('@connext/vector-sdk', () => {
  const routerPublicIdentifier = mkPublicIdentifier('vectorA');
  const senderChainId = parseInt(Object.keys(env.chainProviders)[0]);
  const recipientChainId = parseInt(Object.keys(env.chainProviders)[1]);
  const senderChainProvider = env.chainProviders[0];
  const recipientChainProvider = env.chainProviders[1];

  let connext: ConnextSdk;
  let getChainMock: Sinon.SinonStub;
  let connectNodeMock: Sinon.SinonStub;
  let browserNodeMock: Sinon.SinonStubbedInstance<BrowserNode>

  beforeEach(() => {
    connext = new ConnextSdk();
    getChainMock = Sinon.stub(helpers, 'getChain');
    browserNodeMock = Sinon.createStubInstance(BrowserNode)
    connectNodeMock = Sinon.stub(connextUtils, "connectNode").resolves(browserNodeMock as any)
  });

  afterEach(() => Sinon.restore());

  it('happy case', () => {
    expect(connext.senderChainChannelAddress).to.be.a('string');
    expect(true).to.be.true;
  });

  it('setup function', async () => {
    // sender chain
    getChainMock.onFirstCall().resolves({
      assetDecimals: 18,
      assetId: constants.AddressZero,
      assetName: "",
      chainId: 5,
      chainParams: {chainId,chainName,nativeCurrency},
      chainProvider,
      rpcProvider,
    } as CHAIN_DETAIL);
  });

  it('init function', async () => {
    const setParams: SetupParamsSchema = {
      routerPublicIdentifier: routerPublicIdentifier,
      loginProvider: loginProvider,
      senderChainProvider: senderChainProvider,
      senderAssetId: senderAssetId,
      recipientChainProvider: recipientChainProvider,
      recipientAssetId: recipientAssetId,
      senderChainId: senderChainId,
      recipientChainId: recipientChainId,
    };

    try {
      await connext.init(setParams);
    } catch (e) {
      console.log(e);
    }
  });
});
