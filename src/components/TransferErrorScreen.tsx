import React, { FC } from 'react';
import { ModalContent, ModalBody, Button, Text, Stack } from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from './static';
import { styleModalContent, graphic } from '../constants';

const TransferErrorScreen: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        style={styleModalContent}
        backgroundImage={`url(${graphic})`}
      >
        <Header
          title="transfer error"
          warningIcon={true}
          backButton={true}
          moreButton={true}
        />

        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={5}>
              <Stack direction="column" spacing={3}>
                <Text fontSize="s">
                  An error occurred during the transfer. Your funds are
                  preserved in the state channel and the tranfer can be
                  re-attempted.
                </Text>
                <Text fontSize="s">
                  Support help can be found in the community Discord here.
                </Text>
              </Stack>
              <Stack direction="column" spacing={5}>
                <Button size="lg">Retry Transfer</Button>
                <Button size="lg">Recover Funds</Button>
              </Stack>
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

export default TransferErrorScreen;
