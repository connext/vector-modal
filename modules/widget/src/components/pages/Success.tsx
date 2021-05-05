import React, { FC } from "react";
import { ChainDetail, getExplorerLinkForTx, truncate } from "@connext/vector-sdk";

import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Button,
  InputGroup,
  Input,
  IconButton,
  IconBox,
  CheckCircleIcon,
  CopyIcon,
} from "../common";
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
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
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
                <Stack column={true} spacing={1}>
                  <Text fontSize="1rem">{`Add ${receiverChainInfo.assetName} on ${receiverChainInfo.name} in your wallet.`}</Text>
                  <InputGroup borderRadius="15px">
                    <Input
                      body="lg"
                      id="assetId"
                      name="assetId"
                      value={receiverChainInfo.assetId}
                      inputMode="search"
                      title="Receiver AssetId"
                      // styling
                      fontSize="14px"
                      flex="auto"
                      paddingLeft="12px"
                      paddingRight="0px"
                      // misc
                      readOnly={true}
                    />

                    <IconButton
                      aria-label="Clipboard"
                      onClick={() => {
                        console.log(`Copying: ${receiverChainInfo.assetId}`);
                        navigator.clipboard.writeText(receiverChainInfo.assetId);
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 5000);
                      }}
                    >
                      <IconBox width="1.5rem">{!copiedAddress ? <CopyIcon /> : <CheckCircleIcon />}</IconBox>
                    </IconButton>
                  </InputGroup>
                </Stack>
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
