import React, { FC } from 'react';
import { utils } from 'ethers';
import { ModalContent, ModalBody, Text, Stack, Box } from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, lightGraphic, CHAIN_DETAIL } from '../../constants';
import { Button } from '@material-ui/core';
import { getExplorerLinkForTx } from '../../utils';

export interface SuccessProps {
  amount: string;
  transactionId: string;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
}

const Success: FC<SuccessProps> = props => {
  const {
    amount,
    transactionId,
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
          backgroundImage: `url(${lightGraphic})`,
          backgroundPosition: 'right top',
        }}
      >
        <Header
          title="Success"
          successIcon={true}
          moreButton={true}
          closeButton={true}
        />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Box>
              <Stack direction="row" spacing={2}>
                <Stack direction="column" spacing={2}>
                  <Text fontSize="xl" casing="capitalize">
                    {utils.formatUnits(amount, receiverChainInfo.assetDecimals)}{' '}
                    {receiverChainInfo.assetName}
                  </Text>
                  <Text fontSize="s" casing="capitalize">
                    {`Now available on ${receiverChainInfo.name}.`}
                  </Text>
                </Stack>
                <Box>
                  <Button
                    href={getExplorerLinkForTx(
                      receiverChainInfo.chainId,
                      transactionId
                    )}
                  >
                    view tx
                  </Button>
                </Box>
              </Stack>
            </Box>

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

export default Success;
