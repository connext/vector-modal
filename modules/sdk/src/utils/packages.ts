import {
  DecString,
  FullChannelState,
  INodeService,
  NodeParams,
  NodeResponses,
  OptionalPublicIdentifier,
  Result,
  VectorError,
} from "@connext/vector-types";
import { BigNumber } from "@ethersproject/bignumber";
import { JsonRpcProvider } from "@ethersproject/providers";
import { hexlify } from "@ethersproject/bytes";
import { randomBytes } from "@ethersproject/random";

// declare packages
let vectorBrowserNode: any | undefined = undefined;
let vectorContracts: any | undefined = undefined;
let vectorUtils: any | undefined = undefined;

export const getVectorBrowserNode = async () => {
  if (vectorBrowserNode) {
    return vectorBrowserNode;
  }
  vectorBrowserNode = await import("@connext/vector-browser-node");
  return vectorBrowserNode;
};

export const getVectorContracts = async () => {
  if (vectorContracts) {
    return vectorContracts;
  }
  vectorContracts = await import("@connext/vector-contracts");
  return vectorContracts;
};

export const getVectorUtils = async () => {
  if (vectorUtils) {
    return vectorUtils;
  }
  vectorUtils = await import("@connext/vector-utils");
  return vectorUtils;
};

// TODO: move this into vector-types
export interface IBrowserNode extends INodeService {
  channelProvider: any | undefined; // TODO: IRpcChannelProvider into types package
  connect(config: any): Promise<IBrowserNode>;
  init(params: { signature?: string; signer?: string }): Promise<void>;

  // TODO: move the following into the INodeService interface
  getConfig(): Promise<NodeResponses.GetConfig>;
  withdrawRetry(
    params: OptionalPublicIdentifier<NodeParams.WithdrawRetry>,
  ): Promise<Result<NodeResponses.WithdrawRetry, VectorError>>;
  addTransactionToCommitment(
    params: OptionalPublicIdentifier<NodeParams.AddTransactionToCommitment>,
  ): Promise<Result<void, VectorError>>;
}

// very dumb wrapper around common utils functions
export const getChainInfo = async (chainId: number) => {
  const utils = await getVectorUtils();
  return utils.getChainInfo(chainId);
};

export const delay = async (ms: number) => {
  const utils = await getVectorUtils();
  return utils.delay(ms);
};

export const getChainId = async (chainProvider: string) => {
  const utils = await getVectorUtils();
  return utils.getChainId(chainProvider);
};

export const getAssetDecimals = async (assetId: string, rpcProvider: JsonRpcProvider) => {
  const utils = await getVectorUtils();
  return utils.getAssetDecimals(assetId, rpcProvider);
};

export const calculateExchangeWad = async (
  inputWad: BigNumber,
  inputDecimals: number,
  swapRate: DecString,
  outputDecimals: number,
) => {
  const utils = await getVectorUtils();
  return utils.calculateExchangeWad(inputWad, inputDecimals, swapRate, outputDecimals);
};

export const inverse = async (value: string, precision = 18) => {
  const utils = await getVectorUtils();
  return utils.inverse(value, precision);
};

export const getBalanceForAssetId = async (
  channel: FullChannelState,
  assetId: string,
  participant: "alice" | "bob",
) => {
  const utils = await getVectorUtils();
  return utils.getBalanceForAssetId(channel, assetId, participant);
};

export const createlockHash = async (preImage: string) => {
  const utils = await getVectorUtils();
  return utils.createlockHash(preImage);
};

export const getRandomBytes32 = (): string => hexlify(randomBytes(32));
