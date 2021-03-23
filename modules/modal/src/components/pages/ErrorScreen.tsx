import React, { FC } from 'react';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Button,
  Link,
} from '../common';
import { Header, Footer, NetworkBar } from '../static';
import { CHAIN_DETAIL, ERROR_STATES, ErrorStates } from '@connext/vector-sdk';

export interface ErrorProps {
  error: Error;
  title: string;
  switchNetwork?: () => void;
  retry?: () => void;
  handleRecoveryButton?: () => void;
  options: () => void;
  handleBack: () => void;
  senderChainInfo?: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  state: ErrorStates;
}

const Error: FC<ErrorProps> = (props) => {
  const {
    error,
    title,
    retry,
    switchNetwork,
    options,
    handleBack,
    handleRecoveryButton,
    state,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
  } = props;

  return (
    <>
      <ModalContent id="modalContent">
        <Header
          title={title}
          warningIcon={true}
          handleBack={handleBack}
          options={options}
        />

        <ModalBody>
          <Stack column={true} spacing={5}>
            <Stack column={true} spacing={4}>
              <Stack column={true} spacing={2}>
                <Stack column={true} spacing={1}>
                  <Text
                    fontSize="0.875rem"
                    noOfLines={3}
                    color="crimson"
                    lineHeight="24px"
                  >
                    {error.message}
                  </Text>
                </Stack>
                <Box>
                  {state === ERROR_STATES.ERROR_TRANSFER && (
                    <Text
                      fontSize="0.875rem"
                      lineHeight="24px"
                      textTransform="initial"
                    >
                      An error occurred during the transfer. Your funds are
                      preserved in the state channel and the tranfer can be
                      re-attempted.
                    </Text>
                  )}
                  <Text
                    fontSize="0.875rem"
                    lineHeight="24px"
                    textTransform="initial"
                  >
                    Support help can be found in the{' '}
                    <Link
                      href="https://discord.com/channels/454734546869551114"
                      target="_blank"
                      color="green"
                    >
                      community Discord here
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
