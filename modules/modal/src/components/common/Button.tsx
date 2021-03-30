import styled from 'styled-components';

type ButtonProps = {
  size?: string;
  borderRadius?: string;
  colorScheme?: string;
  color?: string;
  border?: string;
  borderStyle?: string;
  casing?: string;
  marginRight?: string;
  height?: string;
};

export const Button = styled.button<ButtonProps>`
  &&& {
    height: ${props =>
      props.height ||
      props.theme.space[props.theme.sizes[props.size ?? 'md'].h]};
    min-width: ${props =>
      props.theme.space[props.theme.sizes[props.size ?? 'md'].minW]};
    font-size: ${props =>
      props.theme.fontSizes[props.theme.sizes[props.size ?? 'md'].fontSize]};
    padding-left: ${props =>
      props.theme.space[props.theme.sizes[props.size ?? 'md'].px]};
    padding-right: ${props =>
      props.theme.space[props.theme.sizes[props.size ?? 'md'].px]};
    border: ${props => props.border || '1.5px #7b7b7b'};
    border-style: ${props => props.borderStyle || 'solid'};
    border-radius: ${props => props.borderRadius || '15px'};
    background-color: ${props => props.colorScheme || 'white'};
    color: ${props => props.color || 'inherit'};
    text-transform: ${props => props.casing || 'capitalize'};
    margin-right: ${props => props.marginRight || '0px'};
    font-weight: 400;
    font-style: normal;
    font-family: Roboto;
    box-sizing: border-box;
    display: inline-flex;
    appearance: none;
    align-items: center;
    justify-content: center;
    transition: all 250ms ease 0s;
    user-select: none;
    position: relative;
    white-space: nowrap;
    vertical-align: middle;
    outline: none;
    width: auto;
    line-height: 1.2;

    overflow: visible;
    box-shadow: none !important;
    cursor: pointer;
    line-height: inherit;

    &:hover {
      opacity: 1;
      filter: brightness(150%);
    }

    :disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
`;
