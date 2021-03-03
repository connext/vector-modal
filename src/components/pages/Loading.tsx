import React, { FC } from 'react';
import CSS from 'csstype';
import { loadingGif } from '../../public';
import { ModalContent, ModalBody, Text, Stack, Box } from '../common';
import { Footer } from '../static';

interface LoadingProps {
  message: string;
}

const styleLoadingCircle: CSS.Properties = {
  height: '96px',
  width: '96px',
  borderRadius: '64px',
  backgroundColor: '#fcd116',
  overflow: 'hidden',
};

const Loading: FC<LoadingProps> = props => {
  const { message } = props;
  return (
    <>
      <ModalContent>
        <ModalBody padding="2.5rem">
          <Stack column={true} spacing={5} alignItems="center">
            <Box style={styleLoadingCircle}>
              <img
                src={loadingGif}
                alt="loading"
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Text fontSize="1.25rem">{message}</Text>
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default Loading;
