import React, { FC } from "react";
import { ChainDetail, truncate } from "@connext/vector-sdk";

import { ModalContent, ModalBody, Text, Stack, Button } from "../common";
import { Header, Footer, NetworkBar } from "../static";

export interface ExistingBalanceProps {
  isLoad: boolean;
  existingChannelBalance: string;
  senderChainInfo: ChainDetail;
  receiverChainInfo: ChainDetail;
  receiverAddress: string;
  addMoreFunds: () => void;
  continueButton: () => void;
  options: () => void;
}

const ExistingBalance: FC<ExistingBalanceProps> = props => {
  const {
    isLoad,
    existingChannelBalance,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    options,
    continueButton,
    addMoreFunds,
  } = props;
  return (
    <>
      <ModalContent id="modalContent">
        <Header title="Existing Balance" options={options} />
        <ModalBody>
          <Stack column={true} spacing={5}>
            <Stack column={true} spacing={7}>
              <Stack column={true} spacing={3}>
                <Text fontSize="1.5rem" fontFamily="Cooper Hewitt" fontWeight="700" lineHeight="30px" flex="auto">
                  {truncate(existingChannelBalance, 4)} {senderChainInfo.assetName}
                </Text>
                <Text fontSize="14px" color="#333333" textTransform="none">
                  Your existing channel already has a balance. Would you like to continue with these funds or add more
                  for transfer?
                  {/* if you do nothing, the cross chain transfer will start automatically in 10 seconds */}
                </Text>
              </Stack>

              <Stack column={true} spacing={2}>
                <Button size="lg" onClick={continueButton} disabled={isLoad}>
                  continue...
                </Button>

                <Button size="lg" onClick={addMoreFunds}>
                  Add More Funds
                </Button>
              </Stack>
            </Stack>
            <NetworkBar
              senderChainInfo={senderChainInfo}
              receiverChainInfo={receiverChainInfo}
              receiverAddress={receiverAddress}
            />
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default ExistingBalance;
