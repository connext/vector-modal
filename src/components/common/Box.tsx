import styled from 'styled-components';

type BoxProps = {
  colorScheme?: string;
  borderRadius?: string;
};

const Box = styled.div<BoxProps>`
  &&& {
    border-width: 0px;
    border-style: solid;
    box-sizing: border-box;
    background-color: ${props => props.colorScheme};
    border-radius: ${props => props.borderRadius};
  }
`;

export default Box;
