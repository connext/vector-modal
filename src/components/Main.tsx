import React, { FC } from 'react';
import {
  ChakraProvider,
  Modal,
  ModalOverlay,
  useDisclosure,
  Button,
  extendTheme,
} from '@chakra-ui/react';
import Email from './Email';
import Transfer from './Transfer';

const theme = extendTheme({
  styles: {
    global: {
      fonts: {
        // body: 'system-ui, sans-serif',
        heading: '"Cooper Hewitt", serif',
        // mono: 'Menlo, monospace',
      },
      // styles for the `body`
      body: {
        // bg: 'gray.400',
        // color: 'white',
      },
      // styles for the `a`
      a: {
        color: 'teal.500',
        _hover: {
          textDecoration: 'underline',
        },
      },
    },
  },
  colors: {
    brand: {
      100: '#f7fafc',
      // ...
      900: '#1a202c',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontFamily: 'Roboto',
        textTransform: 'capitalize',
      },
      // Two sizes: sm and md
      sizes: {
        sm: {
          fontSize: '12px',
          padding: '16px',
        },
        md: {
          fontSize: '16px',
          padding: '24px',
        },
      },
      // Two variants: outline and solid
      variants: {
        outline: {
          border: '1.5px solid',
          boxSizing: 'border-box',
          borderRadius: '15px',
          borderColor: '#7B7B7B',
          background: 'white',
        },
      },
      // The default size and variant values
      defaultProps: {
        size: 'md',
        variant: 'outline',
      },
    },
    FormControl: {
      baseStyle: {
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontFamily: 'Roboto',
        textTransform: 'capitalize',
      },
      // Two sizes: sm and md
      sizes: {
        sm: {
          fontSize: '12px',
        },
        md: {
          fontSize: '16px',
          padding: '24px',
        },
      },
      // Two variants: outline and solid
      variants: {
        outline: {
          border: '1.5px solid',
          boxSizing: 'border-box',
          borderRadius: '15px',
          borderColor: '#7B7B7B',
          background: 'white',
        },
      },
      // The default size and variant values
      defaultProps: {
        size: 'md',
        variant: 'outline',
      },
    },
  },
});

const Main: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  //   const modalTitle = () => {};
  return (
    <>
      <ChakraProvider theme={theme}>
        <Button onClick={onOpen}>Open Modal</Button>

        <Modal
          id="modal"
          closeOnOverlayClick={false}
          isOpen={isOpen}
          size="md"
          onClose={onClose}
          scrollBehavior="inside"
          isCentered
        >
          <ModalOverlay />
          {/* <Login /> */}
          {/* <Email /> */}
          <Transfer />
        </Modal>
      </ChakraProvider>
    </>
  );
};

export default Main;
