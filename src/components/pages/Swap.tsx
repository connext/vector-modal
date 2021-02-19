import React, { FC } from 'react';
import { ModalContent, ModalBody, Stack } from '@chakra-ui/react';
import { Header, Footer, NetworkBar, InputForm } from '../static';
import { styleModalContent, graphic, CHAIN_DETAIL } from '../../constants';

export interface TransferProps {
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
}

const Swap: FC<TransferProps> = props => {
  const { senderChainInfo, receiverChainInfo, receiverAddress } = props;
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

export default Swap;
