import React, { FC } from 'react';
import { ModalContent, ModalBody, Stack } from '@chakra-ui/react';
import { Header, Footer, NetworkBar, InputForm } from './static';
import { styleModalContent, graphic } from '../constants';

const Transfer: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        style={styleModalContent}
        backgroundImage={`url(${graphic})`}
      >
        <Header title="Send Amount" backButton={true} moreButton={true} />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <InputForm />

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

export default Transfer;
