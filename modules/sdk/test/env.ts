import { ChainProviders } from '@connext/vector-types';
import { Wallet } from '@ethersproject/wallet';

type EngineTestEnv = {
  chainProviders: ChainProviders;
  sugarDaddy: Wallet;
};

export const env: EngineTestEnv = {
  chainProviders: JSON.parse(
    process.env.CHAIN_PROVIDERS ?? '{"1337":"http://localhost:8545"}'
  ),

  sugarDaddy: Wallet.fromMnemonic(
    process.env.SUGAR_DADDY ||
      'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
  ),
};
