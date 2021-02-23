import React, { FC } from 'react';
import {
  ModalContent,
  ModalBody,
  Button,
  Text,
  Stack,
  Link,
} from '@chakra-ui/react';
import { styleModalContent, placeholder } from '../../constants';
import { Header, Footer } from '../static';

interface LoginProps {
  onClose: () => void;
}

const Login: FC<LoginProps> = props => {
  const { onClose } = props;
  return (
    <>
      <ModalContent
        style={{
          ...styleModalContent,
          backgroundImage: `url(${placeholder})`,
          backgroundSize: '10rem',
          backgroundPosition: 'left bottom',
        }}
      >
        <Header
          title="sign in to your wallet"
          subTitle={<SubTitle />}
          onClose={onClose}
        />
        <ModalBody>
          <Stack direction="column" spacing={5}>
            <Button size="lg">Metamask / Web3</Button>
            <Button size="lg">Email</Button>
            <Button size="lg">In-Browser (Less Secure)</Button>
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

const SubTitle: FC = () => {
  return (
    <Text fontSize="md">
      Read{' '}
      <Link href="#" isExternal>
        our blog
      </Link>{' '}
      to learn more about these options.
    </Text>
  );
};

export default Login;
