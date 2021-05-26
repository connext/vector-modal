import { BigNumber } from "@ethersproject/bignumber";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
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

export interface ChainDetail {
  name: string;
  chainId: number;
  chainProvider: string;
  rpcProvider: JsonRpcProvider;
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
  webProvider: Web3Provider;
  preTransferCheck?: boolean;
  // callback
  onDeposited?: (txHash: string) => void;
};

export type TransferParamsSchema = {
  transferQuote: TransferQuote;
  // Callbacks
  onTransferred?: () => void;
};

export type WithdrawParamsSchema = {
  recipientAddress: string;
  onFinished?: (txHash: string, amountUi?: string, amountBn?: BigNumber) => void;
  withdrawalCallTo?: string;
  withdrawalCallData?: string;
  generateCallData?: (toWithdraw: string, toAssetId: string, node: BrowserNode) => Promise<{ callData?: string }>;
};

export type CrossChainSwapParamsSchema = WithdrawParamsSchema & TransferParamsSchema;

export type RecoverParamsSchema = {
  assetId: string;
  recipientAddress: string;
  // Callbacks
  onRecover?: (txHash: string, amountUi?: string, amountBn?: BigNumber) => void;
};
