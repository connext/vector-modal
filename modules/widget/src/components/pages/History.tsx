import React, { FC, useEffect, useState } from "react";
import Select from "react-select";
import { formatUnits } from "@ethersproject/units";
import { Web3Provider } from "@ethersproject/providers";
import { ModalContent, ModalBody, Stack, Box, Text, Button } from "../common";
import {
  BrowserNode,
  getChainInfo,
  ChainInfo,
  WithdrawCommitment,
  truncate,
  getExplorerLinkForTx,
  ChainDetail,
} from "@connext/vector-sdk";

import { Header, Footer } from "../static";
export interface HistoryProps {
  options: () => void;
  node: BrowserNode;
  bobIdentifier: string;
  recipientChainChannelAddress: string;
  rawWebProvider: any;
  receiverChainInfo: ChainDetail;
}
interface WithdrawalRecord {
  isRetry: boolean;
  commitment: WithdrawCommitment;
  transactionHash: string | undefined;
  withdrawChainId: number;
  withdrawAssetName: string;
  amount: string;
  fee: string;
  transferId: string;
}

interface PostProps extends WithdrawalRecord {
  receiverChainInfo: ChainDetail;
  retryWithdraw: (commitment: WithdrawCommitment) => void;
}
const Post: FC<PostProps> = props => {
  const pendingStatus = "pending transfer";
  const { isRetry, retryWithdraw, receiverChainInfo } = props;
  return (
    <>
      <Stack spacing={1}>
        <Text fontSize="1rem" fontFamily="Cooper Hewitt" fontWeight="700" lineHeight="30px" flex="auto">
          {isRetry ? pendingStatus : props.transactionHash!.slice(0, pendingStatus.length - 2)}...
        </Text>
        <Text fontSize="1rem" fontFamily="Cooper Hewitt" fontWeight="700" lineHeight="30px" flex="auto">
          {truncate(formatUnits(props.amount, receiverChainInfo.assetDecimals), 5)} {props.withdrawAssetName}
        </Text>
        <Button
          size="sm"
          borderRadius="5px"
          colorScheme="blue"
          border="none"
          borderStyle="none"
          color="white"
          casing="uppercase"
          onClick={() =>
            isRetry
              ? retryWithdraw(props.commitment)
              : window.open(getExplorerLinkForTx(props.withdrawChainId, props.transactionHash!), "_blank")
          }
        >
          {isRetry ? "Retry " : "View Tx"}
        </Button>
      </Stack>
    </>
  );
};

const History: FC<HistoryProps> = props => {
  const { options, node, bobIdentifier, recipientChainChannelAddress, rawWebProvider, receiverChainInfo } = props;
  const [record, setRecord] = useState<WithdrawalRecord[]>([]);
  const [selectValue, setSelectValue] = useState();
  const [errorMessage, setErrorMessage] = useState<string>();

  const retryWithdraw = async (commitment: WithdrawCommitment) => {
    setErrorMessage(undefined);
    const injectedProvider: Web3Provider = new Web3Provider(rawWebProvider);
    const network = await injectedProvider.getNetwork();
    console.log("1");
    if (receiverChainInfo.chainId !== network.chainId) {
      const defaultMetmaskNetworks = [1, 3, 4, 5, 42];

      if (!defaultMetmaskNetworks.includes(receiverChainInfo.chainId)) {
        // @ts-ignore
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [receiverChainInfo?.chainParams!],
        });
      } else {
        const message = `Please connect your wallet to the ${receiverChainInfo.name} : ${receiverChainInfo.chainId} network`;
        setErrorMessage(message);
        return;
      }
    }
    console.log("1");

    console.log(`Initiate withdrawal retry for ${bobIdentifier}`);
    const signer = injectedProvider.getSigner();
    try {
      // @ts-ignore
      const tx = await signer.sendTransaction(commitment.getSignedTransaction());
      console.log(tx);
    } catch (e) {
      console.log(e);
      setErrorMessage(e.message);
      return;
    }
    getRecord();
  };

  const getRecord = async (_startDate?: number) => {
    setRecord([]);
    const defaultEndDate = new Date();
    console.log(defaultEndDate);

    const startDate = new Date(defaultEndDate.getTime() - 86400_000 * (_startDate ?? 1)); // 1 Day = 86400_000 ms

    console.log(startDate);
    console.log(bobIdentifier, recipientChainChannelAddress);
    const res = await node.getTransfers({
      publicIdentifier: bobIdentifier,
      active: false,
      channelAddress: recipientChainChannelAddress,
      startDate: startDate,
      endDate: defaultEndDate,
    });

    if (res.isError) {
      console.log(res.getError());
      return;
    }

    const transfers = res.getValue();

    transfers.forEach(async (s: any, index: any) => {
      if (s.transferId && s.channelAddress === recipientChainChannelAddress) {
        const ret = await node.getWithdrawalCommitment({ transferId: s.transferId });
        const state = ret.getValue();

        console.log(index, s, state);

        if (state && state.recipient && state.alice !== state.recipient) {
          // console.log("state:", state);
          // console.log("transfer:", s);

          const chain: ChainInfo = await getChainInfo(s.chainId);
          const assetName = chain.assetId[state.assetId]?.symbol ?? "Token";

          const commitment = await WithdrawCommitment.fromJson(state);

          let isRetry: boolean = false;
          if (!state.transactionHash) {
            isRetry = true;
          } else {
            const receipt = await receiverChainInfo.rpcProvider.getTransactionReceipt(state.transactionHash);
            if (!receipt || !receipt.status) {
              isRetry = true;
            }
          }
          const _record = {
            isRetry: isRetry,
            commitment: commitment,
            transactionHash: state.transactionHash ?? undefined,
            withdrawChainId: s.chainId,
            withdrawAssetName: assetName,
            amount: state.amount,
            fee: s.transferState.fee,
            transferId: s.transferId,
          };
          setRecord(rec => rec.concat(_record));
        }
      }
    });
  };

  const resetState = () => {
    setErrorMessage(undefined);
  };
  useEffect(() => {
    resetState();
    getRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event: any) => {
    console.log(event);
    setSelectValue(event);
    getRecord(event.value);
  };

  const TimeOptions = [
    { value: 1, label: "Last 24 Hours" },
    { value: 3, label: "3 Days" },
    { value: 15, label: "15 Days" },
    { value: 30, label: "30 Days" },
    { value: 60, label: "60 Days" },
    { value: 365, label: "1 Year" },
  ];
  return (
    <>
      <ModalContent id="modalContent">
        <Header title={"Transaction History"} options={options} />
        <ModalBody>
          <Stack column={true} spacing={2}>
            <Box>
              <Select
                value={selectValue}
                options={TimeOptions}
                onChange={handleChange}
                placeholder="Select Time Period"
                defaultValue={TimeOptions[0]}
                fullWidth
              />
            </Box>

            {errorMessage && (
              <Text flex="auto" fontSize="0.75rem" textAlign="center">
                {errorMessage}
              </Text>
            )}

            <Stack column={true} spacing={3}>
              <Stack colorScheme="antiquewhite">
                <Text
                  padding="0 0 0 1rem"
                  textAlign="start"
                  fontSize="1rem"
                  fontFamily="Cooper Hewitt"
                  fontWeight="700"
                  lineHeight="30px"
                  flex="auto"
                >
                  Txn Status
                </Text>
                <Text
                  textAlign="center"
                  fontSize="1rem"
                  fontFamily="Cooper Hewitt"
                  fontWeight="700"
                  lineHeight="30px"
                  flex="auto"
                >
                  Value
                </Text>
                <Text
                  padding="0 1rem 0 0"
                  textAlign="end"
                  fontSize="1rem"
                  fontFamily="Cooper Hewitt"
                  fontWeight="700"
                  lineHeight="30px"
                  flex="auto"
                >
                  Visit
                </Text>
              </Stack>
              <Stack column={true} spacing={1}>
                {record.map(c => {
                  return (
                    <Post
                      isRetry={c.isRetry}
                      receiverChainInfo={receiverChainInfo}
                      commitment={c.commitment}
                      transactionHash={c.transactionHash}
                      withdrawChainId={c.withdrawChainId}
                      withdrawAssetName={c.withdrawAssetName}
                      amount={c.amount}
                      fee={c.fee}
                      transferId={c.transferId}
                      retryWithdraw={retryWithdraw}
                    />
                  );
                })}
              </Stack>
            </Stack>
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default History;
