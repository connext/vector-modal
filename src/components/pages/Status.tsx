import React, { FC } from 'react';
import CSS from 'csstype';
import { ModalContent, ModalBody, Text, Stack } from '../common';
import { Header, Footer, NetworkBar } from '../static';
import { CHAIN_DETAIL } from '../../constants';
import { lightGraphic } from '../../public';

export interface StatusProps {
  title: string;
  message: string;
  pendingTransferMessage: string | undefined;
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
    pendingTransferMessage,
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
            {pendingTransferMessage && (
              <Text fontSize="1rem" color="green">
                {pendingTransferMessage}
              </Text>
            )}
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
