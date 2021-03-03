import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

const LoaderContainer = styled.div`
  display: inline-block;
  position: relative;
  width: 1.5em;
  height: 1.5em;

  & * {
    --center: translate(-50%, -50%);
  }

  & .center {
    position: absolute;
    width: 0.28em;
    height: 0.28em;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: var(--center);
  }

  & .outer-spin,
  & .inner-spin {
    position: absolute;
    top: 50%;
    left: 50%;
  }

  & .inner-arc {
    position: absolute;
    width: 0.58em;
    height: 0.58em;
    border-radius: 50%;
    border: 0.06px solid;
  }

  & .inner-arc_start-a {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(45deg);
  }

  & .inner-arc_end-a {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(25deg);
  }

  & .inner-moon-a {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.15em;
    height: 0.15em;
    border-radius: 50%;
    transform: var(--center) translate(0.32em, 0);
  }

  & .inner-moon-b {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.15em;
    height: 0.15em;
    border-radius: 50%;
    transform: var(--center) translate(-0.32em, 0);
  }

  & .inner-arc_start-b {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(65deg) scale(-1, -1);
  }

  & .inner-arc_end-b {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(45deg) scale(-1, -1);
  }

  & .outer-arc {
    position: absolute;
    width: 1.125em;
    height: 1.125em;
    border-radius: 50%;
    border: 0.06px solid;
  }

  & .outer-arc_start-a {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(65deg);
  }

  & .outer-arc_end-a {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(45deg);
  }

  & .outer-moon-a {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.17em;
    height: 0.17em;
    border-radius: 50%;
    transform: var(--center) translate(0.6em, 0);
  }

  & .outer-moon-b {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.17em;
    height: 0.17em;
    border-radius: 50%;
    transform: var(--center) translate(-0.6em, 0);
  }

  & .outer-arc_start-b {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(65deg) scale(-1, -1);
  }

  & .outer-arc_end-b {
    border-color: transparent transparent transparent;
    transform: var(--center) rotate(45deg) scale(-1, -1);
  }

  & .outer-spin {
    animation: ${spin} 4s linear infinite;
  }

  & .inner-spin {
    animation: ${spin} 3s linear infinite;
  }
`;

type LoaderProps = {
  color: string;
};

const Loader = ({ color }: LoaderProps) => {
  return (
    <LoaderContainer>
      <div className={'center'} style={{ background: color }}></div>
      <div className={"inner-spin"}>
        <div
          className={"inner-arc inner-arc_start-a"}
          style={{ borderColor: color }}
        ></div>
        <div
          className={"inner-arc inner-arc_end-a"}
          style={{ borderColor: color }}
        ></div>
        <div
          className={"inner-arc inner-arc_start-b"}
          style={{ borderColor: color }}
        ></div>
        <div
          className={"inner-arc inner-arc_end-b"}
          style={{ borderColor: color }}
        ></div>
        <div className={"inner-moon-a"} style={{ background: color }}></div>
        <div className={"inner-moon-b"} style={{ background: color }}></div>
      </div>
      <div className={"outer-spin"}>
        <div
          className={"outer-arc outer-arc_start-a"}
          style={{ borderColor: color }}
        ></div>
        <div
          className={"outer-arc outer-arc_end-a"}
          style={{ borderColor: color }}
        ></div>
        <div
          className={"outer-arc outer-arc_start-b"}
          style={{ borderColor: color }}
        ></div>
        <div
          className={"outer-arc outer-arc_end-b"}
          style={{ borderColor: color }}
        ></div>
        <div className={"outer-moon-a"} style={{ background: color }}></div>
        <div className={"outer-moon-b"} style={{ background: color }}></div>
      </div>
    </LoaderContainer>
  )
}

export default Loader;
