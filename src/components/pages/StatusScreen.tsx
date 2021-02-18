import React, { FC } from 'react';
import { ModalContent, ModalBody, Text, Stack, Box } from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, lightGraphic } from '../../constants';

const StatusScreen: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        style={styleModalContent}
        backgroundImage={`url(${lightGraphic})`}
        backgroundPosition="right top"
      >
        <Header title="Deposit detected" spinner={true} backButton={true} />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={2}>
              <Box>
                <Text fontSize="s" casing="capitalize">
                  Detected balance on chain, transferring into state channel.
                </Text>
                <Text fontSize="xs" casing="capitalize">
                  Do not close or refresh.
                </Text>
              </Box>
            </Stack>

            <NetworkBar
              fromNetwork="Ethereum Mainnet"
              fromNetworkAsset="USDC"
              toNetwork="Matic Mainnet"
              toNetworkAsset="USDC"
              receiverAddress="0x000abc"
            />
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default StatusScreen;
