import {
  INodeService,
  NodeParams,
  NodeResponses,
  OptionalPublicIdentifier,
  Result,
  VectorError,
} from "@connext/vector-types";

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
