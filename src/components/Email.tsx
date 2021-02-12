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
  Link,
  InputGroup,
  Input,
  FormHelperText,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { useFormik } from 'formik';

import { EmailIcon, CheckIcon } from '@chakra-ui/icons';

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
          backgroundImage: 'url(../assets/placeholder.svg)',
          backgroundPosition: 'right 20px bottom 10px',
        }}
      >
        <ModalHeader>
          <Text fontSize="2xl" casing="uppercase">
            sign in to your wallet
          </Text>

          <Text fontSize="md">
            Read{' '}
            <Link href="#" isExternal>
              our blog
            </Link>{' '}
            to learn more about these options.
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack direction="column" spacing={5}>
            <form onSubmit={formik.handleSubmit}>
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
                <InputRightElement children={<CheckIcon color="green.500" />} />
              </InputGroup>
              <FormHelperText>We'll never share your email.</FormHelperText>
              <Button size="lg" type="submit">
                Submit
              </Button>
            </form>
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

export default Email;
