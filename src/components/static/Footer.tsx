import React, { FC } from 'react';
import styled, { css } from 'styled-components';
import { Text } from './Theme';

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-width: 0;
  border-style: solid;
  box-sizing: border-box;
`;

const Footer: FC = () => {
  return (
    <>
      <ModalFooter>
        <Text
          color="#999999"
          lineHeight="14px"
          letterSpacing="0.2em"
          fontWeight="700"
          textTransform="uppercase"
          textAlign="center"
          fontSize="0.75rem"
        >
          Powered by Connext
        </Text>
      </ModalFooter>
    </>
  );
};

export default Footer;
