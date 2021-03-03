import React, { FC } from 'react';
import CSS from 'csstype';
import {
  Header,
  Footer,
  NetworkBar,
  ModalContent,
  ModalBody,
  Text,
  Stack,
} from '../static';
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
          <Stack column={true} spacing={7}>
            <Stack column={true} spacing={2}>
              <Text fontSize="1rem">{message}</Text>
              <Text fontSize="14px" color="#666666">
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
