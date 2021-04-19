import React, { FC } from "react";
import { ChainDetail, getExplorerLinkForTx, truncate } from "@connext/vector-sdk";

import { ModalContent, ModalBody, Text, Stack, Box, Button } from "../common";
import { Header, Footer } from "../static";

export interface SuccessProps {
  amount: string;
  transactionId: string;
  senderChainInfo: ChainDetail;
  onClose: () => void;
  options: () => void;
}

const RecoverSuccess: FC<SuccessProps> = props => {
  const { amount, transactionId, senderChainInfo, onClose, options } = props;
  return (
    <>
      <ModalContent id="modalContent">
        <Header title="Recover Success" successIcon={true} options={options} onClose={onClose} />
        <ModalBody>
          <Stack column={true} spacing={7}>
            <Box>
              <Stack column={true} spacing={2}>
                <Stack>
                  <Text fontSize="1.5rem" fontFamily="Cooper Hewitt" fontWeight="700" lineHeight="30px" flex="auto">
                    {truncate(amount, 6)} {senderChainInfo.assetName}
                  </Text>
                  <Button
                    size="sm"
                    borderRadius="5px"
                    colorScheme="blue"
                    border="none"
                    borderStyle="none"
                    color="white"
                    casing="uppercase"
                    onClick={() => window.open(getExplorerLinkForTx(senderChainInfo.chainId, transactionId), "_blank")}
                  >
                    view tx
                  </Button>
                </Stack>
                <Box>
                  <Text fontSize="1rem">{`Now available on ${senderChainInfo.name}.`}</Text>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default RecoverSuccess;
