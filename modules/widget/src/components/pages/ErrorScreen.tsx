import React, { FC, useState } from "react";
import { ChainDetail, VectorError } from "@connext/vector-sdk";

import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Button,
  Link,
  IconButton,
  IconBox,
  CopyIcon,
  CheckCircleIcon,
} from "../common";
import { ERROR_STATES, ErrorStates } from "../../constants";
import { Header, Footer, NetworkBar } from "../static";

export interface ErrorProps {
  error: Error;
  title: string;
  senderChannelAddress?: string;
  recipientChannelAddress?: string;
  switchNetwork?: () => void;
  retry?: () => void;
  handleRecoveryButton?: () => void;
  options: () => void;
  handleBack: () => void;
  senderChainInfo?: ChainDetail;
  receiverChainInfo: ChainDetail;
  receiverAddress: string;
  state: ErrorStates;
}

const Error: FC<ErrorProps> = props => {
  const {
    error,
    title,
    retry,
    switchNetwork,
    options,
    handleBack,
    handleRecoveryButton,
    senderChannelAddress,
    recipientChannelAddress,
    state,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
  } = props;
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  return (
    <>
      <ModalContent id="modalContent">
        <Header title={title} warningIcon={true} handleBack={handleBack} options={options} />

        <ModalBody>
          <Stack column={true} spacing={5}>
            <Stack column={true} spacing={4}>
              <Stack column={true} spacing={2}>
                <Stack>
                  <Text fontSize="0.875rem" flex="auto" noOfLines={3} color="crimson" lineHeight="24px">
                    {(error as VectorError)?.context?.counterpartyError?.context?.validationContext?.generateContext
                      ?.reconcileError?.message ??
                      (error as VectorError)?.context?.counterpartyError?.message ??
                      error.message}
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
                  {state === ERROR_STATES.ERROR_TRANSFER && (
                    <Text fontSize="0.875rem" lineHeight="24px" textTransform="initial">
                      An error occurred during the transfer. Your funds are safe and the transfer can be retried.
                    </Text>
                  )}
                  <Text fontSize="0.875rem" lineHeight="24px" textTransform="initial">
                    Support help can be found on our{" "}
                    <Link href="https://support.connext.network" target="_blank" color="green">
                      Support Portal
                    </Link>{" "}
                    .
                  </Text>
                </Box>
              </Stack>
              <Stack column={true} spacing={2}>
                {state === ERROR_STATES.ERROR_NETWORK && (
                  <Button size="lg" onClick={switchNetwork}>
                    Switch to {senderChainInfo?.name!}
                  </Button>
                )}

                {state !== ERROR_STATES.ERROR_NETWORK && retry && (
                  <Button size="lg" onClick={retry}>
                    Retry
                  </Button>
                )}

                {state === ERROR_STATES.ERROR_TRANSFER && (
                  <Button size="lg" onClick={handleRecoveryButton}>
                    Recover Funds
                  </Button>
                )}
              </Stack>
            </Stack>

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

export default Error;
