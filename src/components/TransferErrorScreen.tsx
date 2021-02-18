import React, { FC } from 'react';
import {
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  IconButton,
  Button,
  Text,
  Stack,
  NumberInput,
  NumberInputField,
  Box,
  Divider,
  Input,
} from '@chakra-ui/react';
import { MoreVertical } from 'react-feather';
import { ArrowBackIcon, WarningTwoIcon } from '@chakra-ui/icons';

import { useFormik } from 'formik';
const arrow = require('../assets/network_arrow.svg') as string;
const graphic = require('../assets/graphic.svg') as string;

const TransferErrorScreen: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        bg="#F5F5F5"
        border="2px solid #4D4D4D"
        boxSizing="border-box"
        borderRadius="15px"
        padding="0.5rem"
        backgroundImage={`url(${graphic})`}
        backgroundRepeat="no-repeat"
      >
        <ModalHeader>
          <Box w="100%" display="flex" flexDirection="row">
            <Stack direction="row" spacing={3} alignItems="center" flex="auto">
              <WarningTwoIcon />
              <Text fontSize="2xl" casing="uppercase" flex="auto">
                transfer error
              </Text>
            </Stack>
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
            <Stack direction="column" spacing={5}>
              <Stack direction="column" spacing={3}>
                <Text fontSize="s">
                  An error occurred during the transfer. Your funds are
                  preserved in the state channel and the tranfer can be
                  re-attempted.
                </Text>
                <Text fontSize="s">
                  Support help can be found in the community Discord here.
                </Text>
              </Stack>
              <Stack direction="column" spacing={5}>
                <Button size="lg">Retry Transfer</Button>
                <Button size="lg">Recover Funds</Button>
              </Stack>
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

export default TransferErrorScreen;
