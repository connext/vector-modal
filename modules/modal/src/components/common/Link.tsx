import styled from "styled-components";

type LinkProps = {
  color?: string;
};

export const Link = styled.a<LinkProps>`
  &&& {
    text-decoration: auto;
    color: ${props => props.color};
  }
`;
