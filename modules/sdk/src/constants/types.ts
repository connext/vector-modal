import { providers, BigNumber } from "ethers";
import { BrowserNode } from "@connext/vector-browser-node";
import { TransferQuote } from "@connext/vector-types";

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

export interface CHAIN_DETAIL {
  name: string;
  chainId: number;
  chainProvider: string;
  rpcProvider: providers.JsonRpcProvider;
  assetName: string;
  assetId: string;
  assetDecimals: number;
  chainParams: AddEthereumChainParameter;
}

export type SetupParamsSchema = {
  routerPublicIdentifier: string; // "vectorA876de..."
  loginProvider: any;
  senderChainProvider: string;
  senderAssetId: string;
  recipientChainProvider: string;
  recipientAssetId: string;
  senderChainId?: number;
  recipientChainId?: number;
  iframeSrcOverride?: string;
};

export type InitParamsSchema = SetupParamsSchema;

export type CheckPendingTransferResponseSchema = {
  offChainSenderChainAssetBalanceBn: BigNumber;
  offChainRecipientChainAssetBalanceBn: BigNumber;
};

export type InitResponseSchema = CheckPendingTransferResponseSchema;
export type EstimateFeeParamsSchema = {
  transferAmount: string | undefined;
  isRecipientAssetInput?: boolean;
  userBalanceWei?: string;
};

export type EstimateFeeResponseSchema = {
  error: string | undefined;
  senderAmount: string | undefined;
  recipientAmount: string | undefined;
  totalFee: string | undefined;
  transferQuote: TransferQuote | undefined;
};

export type DepositParamsSchema = {
  transferAmount: string;
  webProvider: providers.Web3Provider;
  preTransferCheck?: boolean;
  // callback
  onDeposited?: (txHash: string) => void;
};

export type WithdrawParamsSchema = {
  recipientAddress: string;
  onFinished?: (txHash: string, amountUi?: string, amountBn?: BigNumber) => void;
  withdrawalCallTo?: string;
  withdrawalCallData?: string;
  generateCallData?: (toWithdraw: string, toAssetId: string, node: BrowserNode) => Promise<{ callData?: string }>;
};

export type TransferParamsSchema = {
  transferQuote?: TransferQuote;
  // Callbacks
  onTransferred?: () => void;
};

export type CrossChainSwapParamsSchema = WithdrawParamsSchema & TransferParamsSchema;
