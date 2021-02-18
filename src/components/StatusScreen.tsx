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
  Spinner,
} from '@chakra-ui/react';
import { MoreVertical } from 'react-feather';
// @ts-ignore
import QRCode from 'qrcode.react';
const arrow = require('../assets/network_arrow.svg') as string;
const lightGraphic = require('../assets/light_graphic.svg') as string;

const StatusScreen: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        bg="#F5F5F5"
        border="2px solid #4D4D4D"
        boxSizing="border-box"
        borderRadius="15px"
        padding="0.5rem"
        backgroundImage={`url(${lightGraphic})`}
        backgroundPosition="right top"
        backgroundRepeat="no-repeat"
      >
        <ModalHeader>
          <Box w="100%" display="flex" flexDirection="row">
            <Stack direction="row" spacing={3} alignItems="center" flex="auto">
              <Spinner
                thickness="3px"
                speed="0.65s"
                color="blue.500"
                size="lg"
              />
              <Text fontSize="2xl" casing="uppercase">
                Deposit detected
              </Text>
            </Stack>

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
                <Text fontSize="s" casing="capitalize">
                  Detected balance on chain, transferring into state channel.
                </Text>
                <Text fontSize="xs" casing="capitalize">
                  Do not close or refresh.
                </Text>
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

export default StatusScreen;
