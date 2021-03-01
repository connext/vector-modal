import React, { FC } from 'react';
import {
  ModalContent,
  ModalBody,
  Button,
  Text,
  Stack,
  Link,
} from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import {
  styleModalContent,
  CHAIN_DETAIL,
  ERROR_STATES,
  ErrorStates,
} from '../../constants';
import { graphic } from '../../public';
import { constants } from 'ethers';

export interface ErrorProps {
  error: Error;
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
    crossChainTransferId,
    retry,
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
      <ModalContent
        id="modalContent"
        style={{
          ...styleModalContent,
          backgroundImage: `url(${graphic})`,
        }}
      >
        <Header
          title="Setup error"
          warningIcon={true}
          handleBack={handleBack}
          options={options}
        />

        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={5}>
              <Stack direction="column" spacing={3}>
                <Stack direction="column" spacing={1}>
                  {crossChainTransferId !== constants.HashZero && (
                    <Text
                      fontFamily="Roboto Mono"
                      fontSize="s"
                      noOfLines={4}
                      color="tomato"
                    >
                      {crossChainTransferId}
                    </Text>
                  )}
                  <Text
                    fontSize="s"
                    noOfLines={4}
                    color="tomato"
                    lineHeight="24px"
                  >
                    {error.message}
                  </Text>
                </Stack>
                <Text fontSize="sm" lineHeight="24px">
                  An error occurred during the transfer. Your funds are
                  preserved in the state channel and the tranfer can be
                  re-attempted.
                </Text>
                <Text fontSize="sm" lineHeight="24px">
                  Support help can be found in the{' '}
                  <Link
                    color="green!important"
                    href="https://discord.com/channels/454734546869551114"
                    isExternal
                  >
                    community Discord here
                  </Link>
                  .
                </Text>
              </Stack>
              <Stack direction="column" spacing={2}>
                {retry && (
                  <Button onClick={retry} size="lg">
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
