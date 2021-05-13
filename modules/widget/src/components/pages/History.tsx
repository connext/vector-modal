import React, { FC, useEffect, useState } from "react";
// import LazyLoad from "react-lazyload";
import { ModalContent, ModalBody, Button, Stack, Text } from "../common";
import { BrowserNode, WithdrawalRecord } from "@connext/vector-sdk";

import { Header, Footer } from "../static";
export interface HistoryProps {
  options: () => void;
  node: BrowserNode;
  bobIdentifier: string;
}

export interface PostProps {
  alice: string;
  bob: string;
  nonce: string;
  recipient: string;
  transactionHash: string;
  withdrawAssetId: string;
  withdrawChainId: number;
  withdrawChannelAddress: string;
  amount: string;
  fee: string;
  transferDefination: string;
  transferId: string;
}

const Post: FC<PostProps> = props => {
  return (
    <>
      <Stack spacing={1}>
        <Text>{props.withdrawChainId}</Text>
        <Text>{props.withdrawAssetId}</Text>
        <Text>{props.amount}</Text>
      </Stack>
    </>
  );
};

const History: FC<HistoryProps> = props => {
  const { options, node, bobIdentifier } = props;

  const [record, setRecord] = useState<WithdrawalRecord[]>([]);

  const getRecord = async (startDate?: Date, endDate?: Date) => {
    console.log("useState", record);

    const defaultStartDate = new Date(-86400_000); // 1 Day = 86400_000 ms
    const defaultEndDate = new Date();

    const res = await node.getTransfers({
      publicIdentifier: bobIdentifier,
      // channelAddress: channelAddress,
      startDate: startDate ?? defaultStartDate,
      endDate: endDate ?? defaultEndDate,
    });

    if (res.isError) {
      throw res.getError();
    }

    const transfers = res.getValue();

    transfers.forEach(async (s: any) => {
      if (s.transferId) {
        const ret = await node.getWithdrawalCommitment({ transferId: s.transferId });
        const state = ret.getValue();

        if (state && state.transactionHash) {
          console.log(state);
          const commitement = {
            alice: state.alice,
            bob: state.bob,
            nonce: state.nonce,
            recipient: state.recipient,
            transactionHash: state.transactionHash,
            withdrawAssetId: state.assetId,
            withdrawChainId: s.chainId,
            withdrawChannelAddress: state.channelAddress,
            amount: state.amount,
            fee: "",
            transferDefination: s.transferDefinition,
            transferId: s.transferId,
          };
          setRecord(rec => rec.concat(commitement));
        }
      }
    });
  };

  useEffect(() => {
    getRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ModalContent id="modalContent">
        <Header title={"Transaction History"} options={options} />
        <ModalBody>
          <Stack column={true} spacing={2}>
            <Stack spacing={2}>
              <Button>1d</Button>
              <Button>3d</Button>
              <Button>15d</Button>
              <Button
                onClick={() => {
                  getRecord();
                }}
              >
                Refresh
              </Button>
            </Stack>

            <Stack column={true} spacing={1}>
              {record.map(entry => {
                // <LazyLoad>
                <Post
                  alice={entry.alice}
                  bob={entry.bob}
                  nonce={entry.nonce}
                  recipient={entry.recipient}
                  transactionHash={entry.transactionHash}
                  withdrawAssetId={entry.withdrawAssetId}
                  withdrawChainId={entry.withdrawChainId}
                  withdrawChannelAddress={entry.withdrawChannelAddress}
                  amount={entry.amount}
                  fee={entry.fee}
                  transferDefination={entry.transferDefination}
                  transferId={entry.transferId}
                />;
                // </LazyLoad>;
              })}
            </Stack>
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default History;
