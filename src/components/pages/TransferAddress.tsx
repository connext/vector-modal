import React, { FC } from 'react';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Input,
} from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, darkGraphic } from '../../constants';
// @ts-ignore
import QRCode from 'qrcode.react';

const TransferAddress: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        style={styleModalContent}
        backgroundImage={`url(${darkGraphic})`}
        backgroundPosition="right top"
      >
        <Header
          title="Ready for transfer"
          backButton={true}
          moreButton={true}
        />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={2}>
              <Box>
                <Stack direction="row" spacing={8}>
                  <Stack direction="column" spacing={2}>
                    <Text fontSize="xs" casing="uppercase">
                      Send USDC on ETHEREUM MAINNET to the QR or address below.
                    </Text>
                    <Text fontSize="xs" casing="uppercase">
                      Awaiting your transfer...
                    </Text>
                  </Stack>
                  <Box bg="white" borderRadius="15px">
                    <QRCode
                      value={'depositAddress'}
                      size={150}
                      style={{ padding: '0.5rem' }}
                    />
                  </Box>
                </Stack>
              </Box>
              <Box display="flex" flexDirection="column">
                <Box
                  bg="#DEDEDE"
                  w="100%"
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  borderRadius="15px"
                >
                  <Input
                    id="address"
                    name="address"
                    placeholder="0x000"
                    inputMode="search"
                    title="Deposit Address"
                    // styling
                    boxShadow="none!important"
                    border="none"
                    size="lg"
                    flex="auto"
                    // misc
                    default="0x000"
                    isReadOnly={true}
                  />
                </Box>
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

export default TransferAddress;
