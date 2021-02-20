import CSS from 'csstype';
import { extendTheme } from '@chakra-ui/react';

export const styleModalContent: CSS.Properties = {
  background: '#F5F5F5',
  border: '2px solid #4D4D4D',
  boxSizing: 'border-box',
  borderRadius: '15px',
  padding: '0.5rem',
  backgroundRepeat: 'no-repeat',
};

export const theme = extendTheme({
  fonts: {
    heading: 'Cooper Hewitt',
    body: 'Roboto',
    mono: 'Roboto Mono',
  },
  colors: {
    brand: {
      100: '#f7fafc',
      // ...
      900: '#1a202c',
    },
  },
  components: {
    Input: {
      baseStyle: {
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontFamily: 'Roboto Mono',
        textTransform: 'capitalize',
      },
      sizes: {
        sm: {
          fontSize: '12px',
        },
        md: {
          fontSize: '16px',
        },
      },
    },
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
