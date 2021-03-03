import styled from 'styled-components';
import Box from './Box';

type InputGroupProps = {
  colorScheme?: string;
  flex?: string;
  borderRadius?: string;
};

export const InputGroup = styled(Box)<InputGroupProps>`
  width: 100%;
  display: flex;
  font-family: 'Roboto Mono';
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
  background-color: ${props => props.colorScheme || '#dedede'};
  border-radius: ${props => props.borderRadius || '5px'};
  flex: ${props => props.flex};
  align-items: center;
`;

type InputProps = {
  size?: string;
  height?: string;
  fontSize?: string;
  paddingLeft?: string;
  paddingRight?: string;
};

export const Input = styled.input<InputProps>`
  height: ${props =>
    props.height || props.theme.space[props.theme.sizes[props.size ?? 'md'].h]};
  font-size: ${props =>
    props.fontSize ||
    props.theme.fontSizes[props.theme.sizes[props.size ?? 'md'].fontSize]};
  padding-left: ${props =>
    props.paddingLeft ||
    props.theme.space[props.theme.sizes[props.size ?? 'md'].px]};
  padding-right: ${props =>
    props.paddingRight ||
    props.theme.space[props.theme.sizes[props.size ?? 'md'].px]};
  width: 100%;
  min-width: 0px;
  outline: 0px;
  position: relative;
  appearance: none;
  transition: all 0.2s ease 0s;
  font-family: inherit;
  font-weight: inherit;
  font-style: inherit;
  line-height: inherit;
  box-shadow: none;
  border-radius: inherit;
  border-width: 0px;
  border-style: initial;
  border-image: initial;
  border-color: inherit;
  background: inherit;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  [type='number'] {
    -moz-appearance: textfield;
  }
  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`;
