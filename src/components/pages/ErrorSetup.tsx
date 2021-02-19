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
import { styleModalContent, graphic, CHAIN_DETAIL } from '../../constants';
import { constants } from 'ethers';

export interface ErrorSetupProps {
  error: Error;
  retry: () => void;
  crossChainTransferId: string;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
}

const ErrorSetup: FC<ErrorSetupProps> = props => {
  const {
    error,
    crossChainTransferId,
    retry,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
  } = props;
  return (
    <>
      <ModalContent
        id="modalContent"
        style={styleModalContent}
        backgroundImage={`url(${graphic})`}
      >
        <Header
          title="Setup error"
          warningIcon={true}
          backButton={true}
          moreButton={true}
        />

        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={5}>
              <Stack direction="column" spacing={3}>
                <Text fontSize="sm" noOfLines={4} color="tomato">
                  `$
                  {crossChainTransferId !== constants.HashZero
                    ? `${crossChainTransferId.substring(0, 10)}... - `
                    : ''}
                  ${error.message}`
                </Text>
                <Text fontSize="s">
                  An error occurred during the transfer. Your funds are
                  preserved in the state channel and the tranfer can be
                  re-attempted.
                </Text>
                <Text fontSize="s">
                  Support help can be found in the{' '}
                  <Link
                    href="https://discord.com/channels/454734546869551114"
                    isExternal
                  >
                    community Discord here
                  </Link>
                  .
                </Text>
              </Stack>
              <Stack direction="column" spacing={2}>
                <Button onClick={retry} size="lg">
                  Retry Transfer
                </Button>
              </Stack>
            </Stack>

            <NetworkBar
              senderChainInfo={senderChainInfo}
              receiverChainInfo={receiverChainInfo}
              receiverAddress={receiverAddress}
            />
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default ErrorSetup;
