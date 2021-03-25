import styled from 'styled-components';
import Box from './Box';

type StackProps = {
  column?: boolean;
  spacing?: number;
  margin?: string;
  justifyContent?: string;
  alignItems?: string;
  colorScheme?: string;
  marginInlineStart?: string;
  borderRadius?: string;
};

export function getStackStyles(column: boolean | undefined, spacing: string) {
  if (column) {
    return `
          margin-top: ${spacing};
          margin-left: 0;
          `;
  } else {
    return `
        margin-left: ${spacing};
        margin-top: 0;
        `;
  }
}

export const Stack = styled(Box)<StackProps>`
  &&& {
    display: flex;
    margin: ${props => props.margin};
    justify-content: ${props => props.justifyContent};
    align-items: ${props => props.alignItems};
    margin-inline-start: ${props => props.marginInlineStart || '0px'};
    flex-direction: ${props => (props.column ? 'column' : 'row')};
    background-color: ${props => props.colorScheme};
    border-radius: ${props => props.borderRadius};

    & > * {
      &:not(:first-child) {
        ${props =>
          getStackStyles(props.column, props.theme.space[props.spacing ?? 0])}
      }
    }
  }
`;
