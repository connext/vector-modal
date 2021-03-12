import styled from 'styled-components';
import Box from './Box';

export const ModalHeader = styled.header`
  &&& {
    padding: 1rem 1.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    border-width: 0px;
    border-style: solid;
    box-sizing: border-box;
  }
`;

export const ModalOverlay = styled.div`
  &&& {
    opacity: 1;
    position: fixed;
    left: 0px;
    top: 0px;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.48);
    z-index: 1400;
  }
`;

type ModalBodyProps = {
  padding?: string;
};

export const ModalBody = styled(Box)<ModalBodyProps>`
  &&& {
    padding: ${props => props.padding || '0.5rem 1.5rem'};
    flex: 1 1 0%;
    overflow: auto;
  }
`;

type ModalContentProps = {
  backgroundImage?: string;
  backgroundPosition?: string;
};

export const ModalContent = styled.section<ModalContentProps>`
  &&& {
    display: flex;
    background-image: ${props => `url(${props.backgroundImage})`};
    background-position: ${props => props.backgroundPosition};
    background-color: #f5f5f5;
    background-repeat: no-repeat;
    flex-direction: column;
    position: relative;
    width: 100%;
    outline: 0px;
    border: 2px solid #4d4d4d;
    box-sizing: border-box;
    border-radius: 15px;
    padding: 0.5rem;
    color: inherit;
    margin-top: 3.75rem;
    margin-bottom: 3.75rem;
    z-index: 1400;
    max-height: calc(100vh - 7.5rem);
    box-shadow: rgb(0 0 0 / 10%) 0px 10px 15px -3px,
      rgb(0 0 0 / 5%) 0px 4px 6px -2px;
    max-width: 28rem;
  }
`;

export const ModalContentContainer = styled(Box)`
  &&& {
    display: flex;
    width: 100vw;
    height: 100vh;
    position: fixed;
    left: 0px;
    top: 0px;
    z-index: 1400;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
`;
