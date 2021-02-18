import React, { FC } from 'react';
import {
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  IconButton,
  Text,
  Stack,
  Box,
  Divider,
  Input,
} from '@chakra-ui/react';
import { MoreVertical } from 'react-feather';
import { ArrowBackIcon } from '@chakra-ui/icons';
// @ts-ignore
import QRCode from 'qrcode.react';
const arrow = require('../assets/network_arrow.svg') as string;
const darkGraphic = require('../assets/dark_graphic.svg') as string;

const TransferAddress: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        bg="#F5F5F5"
        border="2px solid #4D4D4D"
        boxSizing="border-box"
        borderRadius="15px"
        padding="0.5rem"
        backgroundImage={`url(${darkGraphic})`}
        backgroundPosition="right top"
        backgroundRepeat="no-repeat"
      >
        <ModalHeader>
          <Box w="100%" display="flex" flexDirection="row">
            <Text fontSize="2xl" casing="uppercase" flex="auto">
              Ready for transfer
            </Text>
            <IconButton
              aria-label="back"
              border="none"
              bg="transparent"
              icon={<ArrowBackIcon boxSize={6} />}
            />
            <IconButton
              aria-label="back"
              border="none"
              bg="transparent"
              icon={<MoreVertical />}
            />
          </Box>
        </ModalHeader>
        {/* <ModalCloseButton /> */}

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
                    title="Receiver Address"
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

            <Divider
              orientation="horizontal"
              style={{ border: '0.25px solid #666666' }}
            />

            <Stack direction="column" spacing={5}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Text fontSize="xs" casing="uppercase">
                    Ethereum Mainnet
                  </Text>
                  <Text fontSize="xs" casing="uppercase">
                    USDC
                  </Text>
                </Box>
                <img src={arrow} />
                <Box>
                  <Text fontSize="xs" casing="uppercase">
                    Matic Mainnet
                  </Text>{' '}
                  <Text fontSize="xs" casing="uppercase">
                    USDC
                  </Text>
                </Box>
              </Box>
              <Box display="flex" flexDirection="column">
                <Text fontSize="xs" casing="uppercase">
                  Receiver Address
                </Text>
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
                    title="Receiver Address"
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
          </Stack>
        </ModalBody>

        <ModalFooter justifyContent="center">
          <Text
            fontSize="xs"
            casing="uppercase"
            align="center"
            fontStyle="normal"
            fontWeight="bold"
          >
            Powered by Connext
          </Text>
        </ModalFooter>
      </ModalContent>
    </>
  );
};

export default TransferAddress;
