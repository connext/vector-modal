import React, { FC } from 'react';
import CSS from 'csstype';
import { ModalContent, ModalBody, Text, Stack } from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { CHAIN_DETAIL } from '../../constants';
import { lightGraphic } from '../../public';

export interface StatusProps {
  title: string;
  message: string;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  options: () => void;
}

const styleModalContent: CSS.Properties = {
  backgroundImage: `url(${lightGraphic})`,
  background: '#F5F5F5',
  border: '2px solid #4D4D4D',
  boxSizing: 'border-box',
  borderRadius: '15px',
  padding: '0.5rem',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right top',
};

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
      <ModalContent id="modalContent" style={styleModalContent}>
        <Header title={title} spinner={true} options={options} />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={2}>
              <Text fontSize="16px" casing="capitalize">
                {message}
              </Text>
              <Text fontSize="14px" casing="capitalize" color="#666666">
                Do not close or refresh.
              </Text>
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
