import React, { FC } from 'react';
import { utils } from 'ethers';
import CSS from 'csstype';
import { Stack, Box, Button, Link } from '@chakra-ui/react';
import {
  Header,
  Footer,
  NetworkBar,
  ModalContent,
  ModalBody,
  Text,
} from '../static';
import { CHAIN_DETAIL } from '../../constants';
import { lightGraphic } from '../../public';
import { getExplorerLinkForTx } from '../../utils';

export interface SuccessProps {
  amount: string;
  transactionId: string;
  senderChainInfo?: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  onClose: () => void;
  options: () => void;
}

const styleModalContent: CSS.Properties = {
  backgroundImage: `url(${lightGraphic})`,
  backgroundColor: '#F5F5F5',
  border: '2px solid #4D4D4D',
  boxSizing: 'border-box',
  borderRadius: '15px',
  padding: '0.5rem',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right top',
};

const Success: FC<SuccessProps> = props => {
  const {
    amount,
    transactionId,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    onClose,
    options,
  } = props;
  return (
    <>
      <ModalContent id="modalContent" style={styleModalContent}>
        <Header
          title="Success"
          successIcon={true}
          options={options}
          onClose={onClose}
        />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Box>
              <Stack direction="column" spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Text
                    fontSize="1.5rem"
                    fontFamily="Cooper Hewitt"
                    fontWeight="700"
                    lineHeight="30px"
                    // flex="auto"
                  >
                    {utils.formatUnits(amount, receiverChainInfo.assetDecimals)}{' '}
                    {receiverChainInfo.assetName}
                  </Text>
                  <Link
                    href={getExplorerLinkForTx(
                      receiverChainInfo.chainId,
                      transactionId
                    )}
                    isExternal
                  >
                    <Button
                      size="sm"
                      borderRadius="5px"
                      colorScheme="purple"
                      variant="solid"
                      border="none"
                      color="white!important"
                      casing="uppercase!important"
                    >
                      view tx
                    </Button>
                  </Link>
                </Stack>
                <Box>
                  <Text fontSize="1rem">
                    {`Now available on ${receiverChainInfo.name}.`}
                  </Text>
                </Box>
              </Stack>
            </Box>

            {senderChainInfo && receiverChainInfo && (
              <NetworkBar
                senderChainInfo={senderChainInfo}
                receiverChainInfo={receiverChainInfo}
                receiverAddress={receiverAddress}
              />
            )}
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default Success;
