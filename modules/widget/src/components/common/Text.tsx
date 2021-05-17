import styled from "styled-components";

type TextProps = {
  color?: string;
  lineHeight?: string;
  padding?: string;
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
  flex?: string;
};

function truncate(noOfLines: number) {
  return `
      -webkit-line-clamp: ${noOfLines};
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      `;
}

export const Text = styled.p<TextProps>`
  &&& {
    color: ${props => props.color || "black"};
    padding: ${props => props.padding};
    line-height: ${props => props.lineHeight};
    letter-spacing: ${props => props.letterSpacing};
    font-style: ${props => props.fontStyle || "normal"};
    font-family: ${props => props.fontFamily || "Roboto"};
    font-weight: ${props => props.fontWeight || "400"};
    font-size: ${props => props.fontSize || "1rem"};
    text-transform: ${props => props.textTransform || "capitalize"};
    text-align: ${props => props.textAlign};
    margin: ${props => props.margin || "0px"};
    margin-inline-start: ${props => props.marginInlineStart};
    overflow: ${props => props.overflow};
    flex: ${props => props.flex};
    ${props => props.noOfLines && truncate(props.noOfLines)};
    border-width: 0;
    border-style: solid;
    box-sizing: border-box;
  }
`;
