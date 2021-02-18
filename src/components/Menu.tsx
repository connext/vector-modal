import React, { FC } from 'react';
import { ModalContent, ModalBody, Button, Stack } from '@chakra-ui/react';
import { Header, Footer } from './static';
import { styleModalContent, graphic } from '../constants';

const Menu: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        style={styleModalContent}
        backgroundImage={`url(${graphic})`}
      >
        <Header title="Menu" backButton={true} />

        <ModalBody>
          <Stack direction="column">
            <Button size="md" border="none" bg="transparent">
              Go Back
            </Button>
            <Button size="md" border="none" bg="transparent">
              Support Chat
            </Button>
            <Button size="md" border="none" bg="transparent">
              Recover
            </Button>
            <Button size="md" border="none" bg="transparent">
              Option
            </Button>
            <Button size="md" border="none" bg="transparent">
              Option
            </Button>
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default Menu;
