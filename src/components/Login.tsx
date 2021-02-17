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
} from '@chakra-ui/react';

const placeholder = require('../assets/placeholder.svg') as string;

const Login: FC = () => {
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
          backgroundSize: '10rem',
          backgroundPositionY: 'bottom',
          backgroundPositionX: 'left',
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
            <Button size="lg">Metamask / Web3</Button>
            <Button size="lg">Email</Button>
            <Button size="lg">In-Browser (Less Secure)</Button>
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

export default Login;
