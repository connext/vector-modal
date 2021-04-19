import React, { FC } from "react";
import { ChainDetail, getExplorerLinkForTx, truncate } from "@connext/vector-sdk";

import { ModalContent, ModalBody, Text, Stack, Box, Button } from "../common";
import { Header, Footer, NetworkBar } from "../static";

export interface SuccessProps {
  amount: string;
  transactionId: string;
  senderChainInfo?: ChainDetail;
  receiverChainInfo: ChainDetail;
  receiverAddress: string;
  onClose: () => void;
  options: () => void;
}

const Success: FC<SuccessProps> = props => {
  const { amount, transactionId, senderChainInfo, receiverChainInfo, receiverAddress, onClose, options } = props;
  return (
    <>
      <ModalContent id="modalContent">
        <Header title="Success" successIcon={true} options={options} onClose={onClose} />
        <ModalBody>
          <Stack column={true} spacing={7}>
            <Box>
              <Stack column={true} spacing={2}>
                <Stack>
                  <Text fontSize="1.5rem" fontFamily="Cooper Hewitt" fontWeight="700" lineHeight="30px" flex="auto">
                    {truncate(amount, 6)} {receiverChainInfo.assetName}
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
                      window.open(getExplorerLinkForTx(receiverChainInfo.chainId, transactionId), "_blank")
                    }
                  >
                    view tx
                  </Button>
                </Stack>
                <Box>
                  <Text fontSize="1rem">{`Now available on ${receiverChainInfo.name}.`}</Text>
                </Box>
              </Stack>
            </Box>

            {senderChainInfo && receiverChainInfo && (
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

export default Success;
