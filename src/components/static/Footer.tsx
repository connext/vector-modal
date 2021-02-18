import React, { FC } from 'react';
import { ModalFooter, Text } from '@chakra-ui/react';

const Footer: FC = () => {
  return (
    <>
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
    </>
  );
};

export default Footer;
