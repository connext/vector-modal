import React, { FC, useState } from "react";

import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Link,
  IconButton,
  IconBox,
  CopyIcon,
  CheckCircleIcon,
  Button,
} from "../common";
import { Header, Footer } from "../static";

export interface ErrorProps {
  error: Error;
  senderChannelAddress?: string;
  recipientChannelAddress?: string;
  options: () => void;
  handleBack: () => void;
  handleRecoveryButton: () => void;
}

const RecoverError: FC<ErrorProps> = props => {
  const { error, options, handleBack, senderChannelAddress, recipientChannelAddress, handleRecoveryButton } = props;
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  return (
    <>
      <ModalContent id="modalContent">
        <Header title="Recovery Error" warningIcon={true} handleBack={handleBack} options={options} />

        <ModalBody>
          <Stack column={true} spacing={4}>
            <Stack column={true} spacing={2}>
              <Stack>
                <Text fontSize="0.875rem" flex="auto" noOfLines={3} color="crimson" lineHeight="24px">
                  {error.message}
                </Text>
                <IconButton
                  aria-label="Clipboard"
                  onClick={() => {
                    const message = `senderChannelAddress: ${senderChannelAddress}, recipientChannelAddress: ${recipientChannelAddress}, error: ${error.message}`;
                    console.log(`Copying: ${message}`);
                    navigator.clipboard.writeText(message);
                    setCopiedMessage(true);
                    setTimeout(() => setCopiedMessage(false), 5000);
                  }}
                >
                  <IconBox width="1.5rem">{!copiedMessage ? <CopyIcon /> : <CheckCircleIcon />}</IconBox>
                </IconButton>
              </Stack>
              <Box>
                <Text fontSize="0.875rem" lineHeight="24px" textTransform="initial">
                  An error occurred during the Recovery. Do not worry, funds are safe.
                </Text>

                <Text fontSize="0.875rem" lineHeight="24px" textTransform="initial">
                  Support help can be found on our{" "}
                  <Link href="https://support.connext.network" target="_blank" color="green">
                    Support Portal
                  </Link>{" "}
                </Text>
              </Box>
            </Stack>
            <Stack column={true} spacing={2}>
              <Button size="lg" onClick={handleRecoveryButton}>
                Recover Funds
              </Button>
            </Stack>
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default RecoverError;
