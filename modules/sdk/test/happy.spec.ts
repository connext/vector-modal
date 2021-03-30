import { ConnextSdk, SetupParamsSchema } from '../src';
import { expect } from 'chai';
import Sinon from 'sinon';
import { mkPublicIdentifier, mkAddress } from '@connext/vector-utils';
import { env } from './env';

describe('@connext/vector-sdk', () => {
  const routerPublicIdentifier = mkPublicIdentifier('vectorA');
  const senderChainId = parseInt(Object.keys(env.chainProviders)[0]);
  const recipientChainId = parseInt(Object.keys(env.chainProviders)[1]);
  const senderChainProvider = env.chainProviders[0];
  const recipientChainProvider = env.chainProviders[1];

  let connext: ConnextSdk;

  beforeEach(() => {
    connext = new ConnextSdk();
  });

  afterEach(() => Sinon.restore());

  it('happy case', () => {
    expect(connext.senderChainChannelAddress).to.be.a('string');
    expect(true).to.be.true;
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
