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
  Box,
  IconButton,
} from '@chakra-ui/react';
import { MoreHorizontal } from 'react-feather';
const graphic = require('../assets/graphic.svg') as string;

const Menu: FC = () => {
  return (
    <>
      <ModalContent
        id="modalContent"
        bg="#F5F5F5"
        border="2px solid #4D4D4D"
        boxSizing="border-box"
        borderRadius="15px"
        backgroundImage={`url(${graphic})`}
        backgroundRepeat="no-repeat"
      >
        <ModalHeader>
          <Box w="100%" display="flex" flexDirection="row">
            <Text fontSize="2xl" casing="uppercase" flex="auto">
              Menu
            </Text>
            <IconButton
              aria-label="back"
              border="none"
              isRound={true}
              icon={<MoreHorizontal />}
            />
          </Box>
        </ModalHeader>
        {/* <ModalCloseButton /> */}
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

export default Menu;
