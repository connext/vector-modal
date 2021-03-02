import styled, { css } from 'styled-components';

type TextProps = {
  color?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  fontSize?: string;
  textTransform?: string;
  textAlign?: string;
  margin?: string;
  marginInlineStart?: string;
  noOfLines?: number;
  overflow?: string;
};

export function truncate(noOfLines: number) {
  return `
      line-clamp: ${noOfLines};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
}

export const Text = styled.p<TextProps>`
  color: ${props => props.color || 'black'};
  line-height: ${props => props.lineHeight};
  letter-spacing: ${props => props.letterSpacing};
  font-style: ${props => props.fontStyle || 'normal'};
  font-family: ${props => props.fontFamily || 'Roboto'};
  font-weight: ${props => props.fontWeight || '400'};
  font-size: ${props => props.fontSize || '1rem'};
  text-transform: ${props => props.textTransform || 'capitalize'};
  text-align: ${props => props.textAlign};
  margin: ${props => props.margin || '0px'};
  margin-inline-start: ${props => props.marginInlineStart};
  overflow: ${props => props.overflow};
  ${props => props.noOfLines && truncate(props.noOfLines)};
  border-width: 0;
  border-style: solid;
  box-sizing: border-box;
`;

export const Box = styled.div`
  border-width: 0px;
  border-style: solid;
  box-sizing: border-box;
`;

type StackProps = {
  column?: boolean;
  spacing?: number;
  margin?: string;
  justifyContent?: string;
  alignItems?: string;
  marginInlineStart?: string;
};

export const Stack = styled(Box)<StackProps>`
  display: flex;
  margin: ${props => props.margin};
  justify-content: ${props => props.justifyContent};
  align-items: ${props => props.alignItems};
  margin-inline-start: ${props => props.marginInlineStart || '0px'};
  flex-direction: ${props => (props.column ? 'column' : 'row')};

  * {
    &:not(:first-child) {
      margin: ${props =>
        props.column ? `${props.spacing}px 0 0 0` : `0 ${props.spacing}px 0 0`};
    }
  }
`;

export const ModalContentContainer = styled(Box)`
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
`;

export const ModalContent = styled.section`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  outline: 0px;
  border-radius: 0.375rem;
  background: rgb(255, 255, 255);
  color: inherit;
  margin-top: 3.75rem;
  margin-bottom: 3.75rem;
  z-index: 1400;
  max-height: calc(100vh - 7.5rem);
  box-shadow: rgb(0 0 0 / 10%) 0px 10px 15px -3px,
    rgb(0 0 0 / 5%) 0px 4px 6px -2px;
  max-width: 28rem;
`;

type ModalBodyProps = {
  padding?: string;
};

export const ModalBody = styled(Box)<ModalBodyProps>`
  padding: ${props => props.padding || '0.5rem 1.5rem'};
  flex: 1 1 0%;
  overflow: auto;
`;
