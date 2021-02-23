import React, { FC } from 'react';
import { ModalContent, ModalBody, Text, Stack, Box } from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, lightGraphic, CHAIN_DETAIL } from '../../constants';

export interface StatusProps {
  title: string;
  message: string;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  options: () => void;
}

const Status: FC<StatusProps> = props => {
  const {
    title,
    message,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    options,
  } = props;
  return (
    <>
      <ModalContent
        id="modalContent"
        style={{
          ...styleModalContent,
          backgroundImage: `url(${lightGraphic})`,
          backgroundPosition: 'right top',
        }}
      >
        <Header title={title} spinner={true} options={options} />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={2}>
              <Box>
                <Text fontSize="s" casing="capitalize">
                  {message}
                </Text>
                <Text fontSize="s" casing="capitalize" color="#666666">
                  Do not close or refresh.
                </Text>
              </Box>
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

export default Status;
