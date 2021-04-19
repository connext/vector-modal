import React, { FC } from "react";
import { ChainDetail } from "@connext/vector-sdk";

import { ModalContent, ModalBody, Text, Stack } from "../common";
import { Header, Footer, NetworkBar } from "../static";
export interface StatusProps {
  title: string;
  message: string;
  senderChainInfo: ChainDetail;
  receiverChainInfo: ChainDetail;
  receiverAddress: string;
  showNetworkBar?: boolean;
  options: () => void;
}

const Status: FC<StatusProps> = props => {
  const { title, message, senderChainInfo, receiverChainInfo, receiverAddress, options, showNetworkBar = true } = props;
  return (
    <>
      <ModalContent id="modalContent">
        <Header title={title} spinner={true} options={options} />
        <ModalBody>
          <Stack column={true} spacing={7}>
            <Stack column={true} spacing={2}>
              <Text fontSize="1rem">{message}</Text>
              <Text fontSize="14px" color="#666666">
                Do not close or refresh.
              </Text>
            </Stack>

            {showNetworkBar && (
              <NetworkBar
                senderChainInfo={senderChainInfo}
                receiverChainInfo={receiverChainInfo}
                receiverAddress={receiverAddress}
              />
            )}
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default Status;
