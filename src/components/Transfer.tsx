import React, { FC } from 'react';
import {
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Stack,
  NumberInput,
  NumberInputField,
  Box,
  Divider,
} from '@chakra-ui/react';

import { useFormik } from 'formik';
const arrow = require('../assets/network_arrow.svg') as string;
const graphic = require('../assets/graphic.svg') as string;

const Transfer: FC = () => {
  const formik = useFormik({
    initialValues: { amount: '' },
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <>
      <ModalContent
        id="modalContent"
        style={{
          background: '#F5F5F5',
          border: '2px solid #4D4D4D',
          boxSizing: 'border-box',
          borderRadius: '15px',
          padding: '1rem',
          backgroundImage: `url(${graphic})`,
          backgroundRepeat: 'no-repeat',
        }}
      >
        <ModalHeader>
          <Text fontSize="2xl" casing="uppercase">
            Send Amount
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <form onSubmit={formik.handleSubmit}>
              <Stack direction="column" spacing={5}>
                <Box>
                  <Text fontSize="xs" casing="uppercase" textAlign="end">
                    Balance:
                  </Text>
                  <Box
                    bg="white"
                    w="100%"
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    borderRadius="15px"
                  >
                    <NumberInput size="lg" flex="auto">
                      <NumberInputField
                        id="amount"
                        name="amount"
                        placeholder="0.00"
                        inputMode="decimal"
                        title="Token Amount"
                        // styling
                        boxShadow="none!important"
                        border="none"
                        // text-specific options
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        //sanitation
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        // misc
                        onChange={formik.handleChange}
                        value={formik.values.amount}
                      />
                    </NumberInput>

                    <Button
                      size="sm"
                      bg="#DEDEDE"
                      borderRadius="5px"
                      border="none"
                      marginRight="10px"
                      height="1.5rem"
                    >
                      max
                    </Button>
                  </Box>
                </Box>

                <Stack direction="column" spacing={2}>
                  <Box display="flex">
                    <Text fontSize="xs" casing="uppercase" flex="auto">
                      Estimated Fees:
                    </Text>
                    <Text fontSize="xs" casing="uppercase">
                      2345.33
                    </Text>
                  </Box>

                  <Box display="flex">
                    <Text fontSize="xs" casing="uppercase" flex="auto">
                      You will receive:
                    </Text>
                    <Text fontSize="xs" casing="uppercase">
                      2345.33
                    </Text>
                  </Box>
                </Stack>

                <Button size="lg" type="submit">
                  Submit
                </Button>
              </Stack>
            </form>

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
                  <NumberInput size="lg" flex="auto">
                    <NumberInputField
                      id="address"
                      name="address"
                      placeholder="0x000"
                      inputMode="search"
                      title="Receiver Address"
                      // styling
                      boxShadow="none!important"
                      border="none"
                      // misc
                      isReadOnly
                    />
                  </NumberInput>
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

export default Transfer;
