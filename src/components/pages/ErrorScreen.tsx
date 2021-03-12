import React, { FC } from 'react';
import { constants } from 'ethers';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Button,
  InputGroup,
  Input,
  Link,
} from '../common';
import { Header, Footer, NetworkBar } from '../static';
import { CHAIN_DETAIL, ERROR_STATES, ErrorStates } from '../../constants';
import { graphic } from '../../public';

export interface ErrorProps {
  error: Error;
  title: string;
  switchNetwork?: () => void;
  retry?: () => void;
  handleRecoveryButton?: () => void;
  options: () => void;
  handleBack: () => void;
  crossChainTransferId: string;
  senderChainInfo?: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  state: ErrorStates;
}

const Error: FC<ErrorProps> = props => {
  const {
    error,
    title,
    crossChainTransferId,
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
      <ModalContent id="modalContent" backgroundImage={graphic}>
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
                  {crossChainTransferId !== constants.HashZero && (
                    <Stack column={true} spacing={1}>
                      <Text
                        fontFamily="Roboto Mono"
                        fontSize="0.875rem"
                        noOfLines={1}
                      >
                        OrderId
                      </Text>
                      <InputGroup>
                        <Input
                          id="orderId"
                          name="orderId"
                          body="sm"
                          value={crossChainTransferId}
                          inputMode="search"
                          title="OrderId"
                          readOnly={true}
                        />
                      </InputGroup>
                    </Stack>
                  )}
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
