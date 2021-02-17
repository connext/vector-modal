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
  Box,
  InputGroup,
  Input,
  FormHelperText,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { useFormik } from 'formik';

import { EmailIcon, CheckIcon } from '@chakra-ui/icons';

const placeholder = require('../assets/placeholder.svg') as string;

const Email: FC = () => {
  const formik = useFormik({
    initialValues: { email: '' },
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
          backgroundImage: `url(${placeholder})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '8rem',
          backgroundPositionY: 'bottom',
          backgroundPositionX: 'left',
        }}
      >
        <ModalHeader>
          <Text fontSize="2xl" casing="uppercase">
            enter your email
          </Text>

          <Text fontSize="md">
            Or visit gmail.com to learn more about email.
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={formik.handleSubmit}>
            <Stack direction="column" spacing={5}>
              <Box>
                <InputGroup>
                  <InputLeftElement children={<EmailIcon />} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    size="lg"
                    placeholder="welcome@gmail.com"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                  />
                  <InputRightElement
                    children={<CheckIcon color="green.500" />}
                  />
                </InputGroup>
                <FormHelperText>We'll never share your email.</FormHelperText>
              </Box>
              <Button size="lg" type="submit">
                Submit
              </Button>
            </Stack>
          </form>
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

export default Email;
