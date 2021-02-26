import React, { FC } from 'react';
import { ModalFooter, Text } from '@chakra-ui/react';

const Footer: FC = () => {
  return (
    <>
      <ModalFooter className="global-style" justifyContent="center">
        <Text
          className="global-style"
          fontSize="xs"
          casing="uppercase"
          align="center"
          fontWeight="700"
          style={{
            lineHeight: '14px',
            letterSpacing: '0.2em',
            color: '#999999',
          }}
        >
          Powered by Connext
        </Text>
      </ModalFooter>
    </>
  );
};

export default Footer;
