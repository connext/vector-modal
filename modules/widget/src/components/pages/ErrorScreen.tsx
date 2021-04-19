import React, { FC, useState } from "react";
import { ChainDetail } from "@connext/vector-sdk";

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
                  {state === ERROR_STATES.ERROR_TRANSFER && (
                    <Text fontSize="0.875rem" lineHeight="24px" textTransform="initial">
                      An error occurred during the transfer. Your funds are preserved in the state channel and the
                      tranfer can be re-attempted.
                    </Text>
                  )}
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
                    <Link href="https://discord.com/channels/454734546869551114" target="_blank" color="green">
                      community Discord
                    </Link>
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

                {retry && (
                  <Button size="lg" onClick={retry}>
                    Retry Transfer
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