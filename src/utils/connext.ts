import { BrowserNode } from '@connext/vector-browser-node';
import { ChannelMastercopy } from '@connext/vector-contracts';
import {
  ConditionalTransferCreatedPayload,
  ConditionalTransferResolvedPayload,
  DepositReconciledPayload,
  EngineEvents,
  FullChannelState,
  NodeParams,
  NodeResponses,
  TransferNames,
  WithdrawalReconciledPayload,
} from '@connext/vector-types';
import { createlockHash, getBalanceForAssetId } from '@connext/vector-utils';
import { providers, Contract, BigNumber, constants, utils } from 'ethers';
import { Evt } from 'evt';
import { getOnchainBalance } from './helpers';
import { iframeSrc } from '../constants';

export const connectNode = async (
  connextNode: BrowserNode | undefined,
  routerPublicIdentifier: string,
  depositChainId: number,
  withdrawChainId: number,
  depositChainProvider: string,
  withdrawChainProvider: string
): Promise<BrowserNode> => {
  console.log('Connect Node');
  let browserNode: BrowserNode;

  try {
    if (connextNode) {
      browserNode = connextNode;
    } else {
      browserNode = new BrowserNode({
        routerPublicIdentifier,
        iframeSrc,
        supportedChains: [depositChainId, withdrawChainId],
        chainProviders: {
          [depositChainId]: depositChainProvider,
          [withdrawChainId]: withdrawChainProvider,
        },
      });
    }
    await browserNode.init();
  } catch (e) {
    console.error(e);
    throw new Error(`connecting to iframe: ${e}`);
  }
  console.log('connection success');

  const configRes = await browserNode.getConfig();
  if (!configRes[0]) throw new Error(`Error getConfig: node connection failed`);

  console.log('GET CONFIG: ', configRes[0]);

  return browserNode;
};

export const getTotalDepositsBob = async (
  channelAddress: string,
  assetId: string,
  provider: providers.BaseProvider
): Promise<BigNumber> => {
  // see if contract was deployed
  const code = await provider.getCode(channelAddress);
  if (code === '0x') {
    // channel not deployed, all $$ at addr is users
    return getOnchainBalance(provider, assetId, channelAddress);
  }
  // get from chain
  return new Contract(
    channelAddress,
    ChannelMastercopy.abi,
    provider
  ).getTotalDepositsBob(assetId);
};

// throws results to be used in retryWithDelay fn
export const reconcileDeposit = async (
  node: BrowserNode,
  channelAddress: string,
  assetId: string
) => {
  const ret = await node.reconcileDeposit({ channelAddress, assetId });
  if (ret.isError) {
    throw ret.getError();
  }
  return ret.getValue();
};

export const createFromAssetTransfer = async (
  node: BrowserNode,
  fromChainId: number,
  _fromAssetId: string,
  toChainId: number,
  _toAssetId: string,
  routerPublicIdentifier: string,
  crossChainTransferId: string,
  preImage: string
): Promise<{ transferId: string; preImage: string }> => {
  const depositChannel = await getChannelForChain(
    node,
    routerPublicIdentifier,
    fromChainId
  );
  const fromAssetId = utils.getAddress(_fromAssetId);
  const toAssetId = utils.getAddress(_toAssetId);
  const assetIdx = depositChannel.assetIds.findIndex(a => a === fromAssetId);
  if (assetIdx === -1) {
    throw new Error('Asset not in channel, please deposit');
  }
  const toTransfer = getBalanceForAssetId(depositChannel, fromAssetId, 'bob');
  if (toTransfer === '0') {
    throw new Error('Asset not in channel, please deposit');
  }
  const params: NodeParams.ConditionalTransfer = {
    recipient: depositChannel.bobIdentifier,
    recipientChainId: toChainId,
    recipientAssetId: toAssetId,
    channelAddress: depositChannel.channelAddress,
    type: TransferNames.HashlockTransfer,
    assetId: fromAssetId,
    amount: toTransfer,
    meta: {
      routingId: crossChainTransferId,
      crossChainTransferId,
      fromAssetId,
      toAssetId,
    },
    details: { expiry: '0', lockHash: createlockHash(preImage) },
    publicIdentifier: depositChannel.bobIdentifier,
  };
  const ret = await node.conditionalTransfer(params);
  if (ret.isError) {
    throw ret.getError();
  }
  const { transferId } = ret.getValue();
  return {
    transferId,
    preImage,
  };
};

export const resolveToAssetTransfer = async (
  node: BrowserNode,
  toChainId: number,
  preImage: string,
  crossChainTransferId: string,
  routerPublicIdentifier: string
): Promise<{ transferId: string }> => {
  const withdrawChannel = await getChannelForChain(
    node,
    routerPublicIdentifier,
    toChainId
  );

  const transfer = await node.getTransferByRoutingId({
    channelAddress: withdrawChannel.channelAddress,
    routingId: crossChainTransferId,
    publicIdentifier: withdrawChannel.bobIdentifier,
  });
  if (transfer.isError) {
    throw transfer.getError();
  }
  if (!transfer.getValue()) {
    throw new Error(
      `Cross-chain transfer not found in receiver channel: ${crossChainTransferId}`
    );
  }
  const params: NodeParams.ResolveTransfer = {
    publicIdentifier: withdrawChannel.bobIdentifier,
    channelAddress: withdrawChannel.channelAddress,
    transferId: transfer.getValue()!.transferId,
    transferResolver: { preImage },
    meta: { crossChainTransferId, routingId: crossChainTransferId },
  };
  const ret = await node.resolveTransfer(params);
  if (ret.isError) {
    throw ret.getError();
  }
  return { transferId: transfer.getValue()!.transferId };
};

export const waitForSenderCancels = async (
  node: BrowserNode,
  evt: Evt<ConditionalTransferResolvedPayload>,
  depositChannelAddress: string
) => {
  const active = await node.getActiveTransfers({
    channelAddress: depositChannelAddress,
  });
  if (active.isError) {
    throw active.getError();
  }
  const hashlock = active.getValue().filter(t => {
    return Object.keys(t.transferState).includes('lockHash');
  });
  await Promise.all(
    hashlock.map(async t => {
      try {
        await evt.waitFor(
          data =>
            data.transfer.transferId === t.transferId &&
            data.channelAddress === depositChannelAddress &&
            Object.values(data.transfer.transferResolver)[0] ===
              constants.HashZero,
          300_000
        );
      } catch (e) {
        console.error('Timed out waiting for cancellation:', e);
      }
    })
  );
  const final = await node.getActiveTransfers({
    channelAddress: depositChannelAddress,
  });
  if (final.isError) {
    throw final.getError();
  }
  const remaining = final.getValue().filter(t => {
    return Object.keys(t.transferState).includes('lockHash');
  });
  if (remaining.length > 0) {
    throw new Error('Hanging sender transfers');
  }
};

export const cancelToAssetTransfer = async (
  node: BrowserNode,
  withdrawChannelAddess: string,
  transferId: string
): Promise<NodeResponses.ResolveTransfer> => {
  const params = {
    channelAddress: withdrawChannelAddess,
    transferId: transferId,
    transferResolver: { preImage: constants.HashZero },
  };
  const ret = await node.resolveTransfer(params);
  if (ret.isError) {
    throw ret.getError();
  }
  return ret.getValue();
};

export const cancelHangingToTransfers = async (
  node: BrowserNode,
  evt: Evt<ConditionalTransferResolvedPayload>,
  fromChainId: number,
  toChainId: number,
  _toAssetId: string,
  routerPublicIdentifier: string
): Promise<(NodeResponses.ResolveTransfer | undefined)[]> => {
  const depositChannel = await getChannelForChain(
    node,
    routerPublicIdentifier,
    fromChainId
  );
  const withdrawChannel = await getChannelForChain(
    node,
    routerPublicIdentifier,
    toChainId
  );

  const toAssetId = utils.getAddress(_toAssetId);
  const transfers = await node.getActiveTransfers({
    publicIdentifier: withdrawChannel.bobIdentifier,
    channelAddress: withdrawChannel.channelAddress,
  });
  if (transfers.isError) {
    throw transfers.getError();
  }

  const toCancel = transfers.getValue().filter(t => {
    const amResponder = t.responderIdentifier === withdrawChannel.bobIdentifier;
    const correctAsset = t.assetId === toAssetId;
    const isHashlock = Object.keys(t.transferState).includes('lockHash');
    const wasForwarded = !!t.meta?.routingId;
    return amResponder && correctAsset && isHashlock && wasForwarded;
  });

  // wait for all hanging transfers to cancel
  const hangingResolutions = (await Promise.all(
    toCancel.map(async transferToCancel => {
      try {
        console.log(
          'Cancelling hanging receiver transfer:',
          transferToCancel.meta!.routingId
        );
        const params: NodeParams.ResolveTransfer = {
          publicIdentifier: withdrawChannel.bobIdentifier,
          channelAddress: withdrawChannel.channelAddress,
          transferId: transferToCancel.transferId,
          transferResolver: { preImage: constants.HashZero },
        };
        // for receiver transfer cancellatino
        const resolved = await new Promise(async (res, rej) => {
          const resolveRes = await node.resolveTransfer(params);
          if (resolveRes.isError) {
            console.error('Failed to cancel transfer:', resolveRes.getError());
            return rej(resolveRes.getError()?.message);
          }
          return res(resolveRes.getValue());
        });
        // for sender transfer cancellation
        await evt.waitFor(
          data =>
            data.transfer.meta.routingId === transferToCancel.meta!.routingId &&
            data.channelAddress === depositChannel.channelAddress &&
            Object.values(data.transfer.transferResolver)[0] ===
              constants.HashZero,
          45_000
        );
        return resolved;
      } catch (e) {
        console.error('Error cancelling hanging', e);
        return undefined;
      }
    })
  )) as (NodeResponses.ResolveTransfer | undefined)[];
  return hangingResolutions;
};

export const withdrawToAsset = async (
  node: BrowserNode,
  toChainId: number,
  _toAssetId: string,
  recipientAddr: string,
  routerPublicIdentifier: string
): Promise<{ withdrawalTx: string; withdrawalAmount: string }> => {
  const withdrawChannel = await getChannelForChain(
    node,
    routerPublicIdentifier,
    toChainId
  );

  const toAssetId = utils.getAddress(_toAssetId);
  const toWithdraw = getBalanceForAssetId(withdrawChannel, toAssetId, 'bob');
  if (toWithdraw === '0') {
    throw new Error('Asset not in receiver channel');
  }

  const params: NodeParams.Withdraw = {
    amount: toWithdraw,
    assetId: toAssetId,
    channelAddress: withdrawChannel.channelAddress,
    publicIdentifier: withdrawChannel.bobIdentifier,
    recipient: recipientAddr,
  };
  const ret = await node.withdraw(params);
  if (ret.isError) {
    throw ret.getError();
  }
  const { transactionHash } = ret.getValue();
  if (!transactionHash) {
    // TODO: prompt router to retry sending transaction
    throw new Error('Router failed to withdraw');
  }

  const result = {
    withdrawalTx: transactionHash,
    withdrawalAmount: toWithdraw,
  };
  return result;
};

// return strings, does not need to be retried
export const verifyRouterSupportsTransfer = async (
  node: BrowserNode,
  fromChainId: number,
  _fromAssetId: string,
  toChainId: number,
  _toAssetId: string,
  ethProvider: providers.BaseProvider, // For `to` chain
  routerPublicIdentifier: string,
  transferAmount?: string
): Promise<void> => {
  const withdrawChannel = await getChannelForChain(
    node,
    routerPublicIdentifier,
    toChainId
  );

  const fromAssetId = utils.getAddress(_fromAssetId);
  const toAssetId = utils.getAddress(_toAssetId);
  const config = await node.getRouterConfig({
    routerIdentifier: withdrawChannel.aliceIdentifier,
  });
  if (config.isError) {
    throw new Error('Router config unavailable');
  }
  const { supportedChains, allowedSwaps } = config.getValue();
  if (
    !supportedChains.includes(fromChainId) ||
    !supportedChains.includes(toChainId)
  ) {
    throw new Error(`Router does not support chains`);
  }
  // @ts-ignore
  const swap = allowedSwaps.find(s => {
    const noninverted =
      s.fromAssetId.toLowerCase() === fromAssetId.toLowerCase() &&
      s.fromChainId === fromChainId &&
      s.toAssetId.toLowerCase() === toAssetId.toLowerCase() &&
      s.toChainId === toChainId;
    const inverted =
      s.toAssetId.toLowerCase() === fromAssetId.toLowerCase() &&
      s.toChainId === fromChainId &&
      s.fromAssetId.toLowerCase() === toAssetId.toLowerCase() &&
      s.fromChainId === toChainId;
    return noninverted || inverted;
  });
  if (!swap) {
    throw new Error('Swap is not supported by router');
  }

  // Verify sufficient gas
  const minGas = utils.parseEther('0.1');
  const routerGasBudget = await getOnchainBalance(
    ethProvider,
    constants.AddressZero,
    withdrawChannel.alice
  );
  if (routerGasBudget.lt(minGas)) {
    throw new Error('Router has insufficient gas funds');
  }

  // if there is a transfer amount supplied, verify collateral
  if (!transferAmount) {
    return;
  }

  const routerOnchain = await getOnchainBalance(
    ethProvider,
    toAssetId,
    withdrawChannel.alice
  );
  const routerOffchain = BigNumber.from(
    getBalanceForAssetId(withdrawChannel, toAssetId, 'alice')
  );
  if (routerOffchain.gte(transferAmount)) {
    return;
  }

  const collateralCushion = utils.parseEther('1');
  const min = routerOnchain.add(routerOffchain).add(collateralCushion);
  if (min.lt(transferAmount)) {
    throw new Error('Router has insufficient collateral');
  }

  return;
};

export type EvtContainer = {
  [EngineEvents.CONDITIONAL_TRANSFER_CREATED]: Evt<
    ConditionalTransferCreatedPayload
  >;
  [EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]: Evt<
    ConditionalTransferResolvedPayload
  >;
  [EngineEvents.DEPOSIT_RECONCILED]: Evt<DepositReconciledPayload>;
  [EngineEvents.WITHDRAWAL_RECONCILED]: Evt<WithdrawalReconciledPayload>;
};

export const createEvtContainer = (node: BrowserNode): EvtContainer => {
  const createdTransfer = Evt.create<ConditionalTransferCreatedPayload>();
  const resolvedTransfer = Evt.create<ConditionalTransferResolvedPayload>();
  const deposit = Evt.create<DepositReconciledPayload>();
  const withdraw = Evt.create<WithdrawalReconciledPayload>();

  node.on(EngineEvents.CONDITIONAL_TRANSFER_CREATED, data => {
    createdTransfer.post(data);
  });
  node.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, data => {
    resolvedTransfer.post(data);
  });
  node.on(EngineEvents.DEPOSIT_RECONCILED, data => {
    deposit.post(data);
  });
  node.on(EngineEvents.WITHDRAWAL_RECONCILED, data => {
    withdraw.post(data);
  });
  return {
    [EngineEvents.CONDITIONAL_TRANSFER_CREATED]: createdTransfer,
    [EngineEvents.CONDITIONAL_TRANSFER_RESOLVED]: resolvedTransfer,
    [EngineEvents.DEPOSIT_RECONCILED]: deposit,
    [EngineEvents.WITHDRAWAL_RECONCILED]: withdraw,
  };
};

export const getChannelForChain = async (
  node: BrowserNode,
  routerIdentifier: string,
  chainId: number
): Promise<FullChannelState> => {
  const depositChannelRes = await node.getStateChannelByParticipants({
    chainId,
    counterparty: routerIdentifier,
  });
  if (depositChannelRes.isError) {
    throw depositChannelRes.getError();
  }
  const channel = depositChannelRes.getValue();
  if (!channel) {
    throw new Error(`Could not find channel on ${chainId}`);
  }
  return channel as FullChannelState;
};
