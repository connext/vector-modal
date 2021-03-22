import React, { FC, useRef, useEffect } from 'react';
import { Rive, Layout } from 'rive-js';
import styled from 'styled-components';
import { ModalContent, ModalBody, Text, Stack } from '../common';
import { Footer } from '../static';

interface LoadingProps {
  message: string;
}

const Loading: FC<LoadingProps> = (props) => {
  const { message } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const animationContainer = useRef<HTMLDivElement>(null);

  // Resizes the canvas to match the parent element
  useEffect(() => {
    const resize = () => {
      if (animationContainer.current && canvas.current) {
        const {
          width,
          height,
        } = animationContainer.current.getBoundingClientRect();
        console.log(width, height);
        canvas.current.width = 300;
        canvas.current.height = 130;
      }
    };

    resize();
  });

  // Start the animation
  useEffect(() => {
    const rive = new Rive({
      src: 'https://connext-media.s3.us-east-2.amazonaws.com/loading.riv',
      canvas: canvas.current,
      autoplay: true,
      layout: new Layout('cover', 'center'),
    });

    return () => rive?.stop();
  }, []);
  return (
    <>
      <ModalContent>
        <ModalBody padding="1rem">
          <Stack column={true} spacing={5} alignItems="center">
            <AppLogo ref={animationContainer}>
              <canvas ref={canvas} />
            </AppLogo>
            <Text fontSize="1.25rem">{message}</Text>
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default Loading;

const AppLogo = styled.div`
  &&& {
    pointer-events: none;
    clip-path: circle(60px at center);
  }
`;
