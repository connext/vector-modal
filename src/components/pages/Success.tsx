import React, { FC } from 'react';
import { utils } from 'ethers';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Button,
  Link,
} from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, CHAIN_DETAIL } from '../../constants';
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
      <ModalContent
        id="modalContent"
        className="global-style"
        style={{
          ...styleModalContent,
          backgroundImage: `url(${lightGraphic})`,
          backgroundPosition: 'right top',
        }}
      >
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
                    fontSize="2xl"
                    casing="capitalize"
                    fontFamily="Cooper Hewitt"
                    fontStyle="normal"
                    fontWeight="700"
                    lineHeight="30px"
                    flex="auto"
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
                  <Text fontSize="s" casing="capitalize">
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
