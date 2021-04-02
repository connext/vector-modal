import React, { FC, useRef, useEffect } from "react";
import { Rive, Layout } from "rive-js";
import styled from "styled-components";
import { ModalContent, ModalBody, Text, Stack } from "../common";
import { Footer } from "../static";

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
        const { width: w, height: h } = animationContainer.current.getBoundingClientRect();
        canvas.current.width = w;
        canvas.current.height = h;
      }
    };

    resize();
  });

  // Start the animation
  useEffect(() => {
    const rive = Rive.new({
      src: "https://cdn.connext.network/loading.riv",
      canvas: canvas.current,
      // animation: animation,
      autoplay: true,
      layout: new Layout("cover", "center"),
    });

    return () => rive.stop();
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
