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
                  An error occurred during the Recovery.
                </Text>

                <Text fontSize="0.875rem" lineHeight="24px" textTransform="initial">
                  Support help can be found in the{" "}
                  <Link
                    href="https://www.notion.so/connext/Vector-Cross-Chain-Widget-Debug-Steps-99f5879739984186a35ac2714a3b4671"
                    target="_blank"
                    color="green"
                  >
                    FAQ
                  </Link>{" "}
                  Or{" "}
                  <Link href="https://discord.gg/AGpyHSbYCe" target="_blank" color="green">
                    community Discord
                  </Link>
                  .
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
