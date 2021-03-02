import React, { FC } from 'react';
import CSS from 'csstype';
import { Stack, Box } from '@chakra-ui/react';
import { loadingGif } from '../../public';
import { Footer, ModalContent, ModalBody, Text } from '../static';

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

const styleModalContent: CSS.Properties = {
  backgroundColor: '#F5F5F5',
  border: '2px solid #4D4D4D',
  boxSizing: 'border-box',
  borderRadius: '15px',
  padding: '0.5rem',
  backgroundRepeat: 'no-repeat',
};

const Loading: FC<LoadingProps> = props => {
  const { message } = props;
  return (
    <>
      <ModalContent style={styleModalContent}>
        <ModalBody padding="2.5rem">
          <Stack direction="column" spacing={5} alignItems="center">
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
