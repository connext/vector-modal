import React from "react";
import styled from "styled-components";

// Icons

interface IconBoxProps {
  width?: string;
}
export const IconBox = styled.div<IconBoxProps>`
  border-width: 0px;
  border-style: solid;
  box-sizing: border-box;
  width: ${props => props.width || "1.125rem"};
  line-height: 1em;
  flex-shrink: 0;
  color: currentcolor;
  vertical-align: middle;
  display: block;
`;

export const WarningIcon = () => {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M23.119,20,13.772,2.15h0a2,2,0,0,0-3.543,0L.881,20a2,2,0,0,0,1.772,2.928H21.347A2,2,0,0,0,23.119,20ZM11,8.423a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Zm1.05,11.51h-.028a1.528,1.528,0,0,1-1.522-1.47,1.476,1.476,0,0,1,1.448-1.53h.028A1.527,1.527,0,0,1,13.5,18.4,1.475,1.475,0,0,1,12.05,19.933Z"
      ></path>
    </svg>
  );
};

export const CopyIcon = () => {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      ></path>
    </svg>
  );
};

export const CheckCircleIcon = () => {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z"
      ></path>
    </svg>
  );
};

// IconButton
type IconButtonProps = {
  onClick: (e?: React.MouseEvent) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
};

export const IconButton = styled.button<IconButtonProps>`
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
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
  border-radius: 0.375rem;
  font-weight: 400;
  font-style: normal;
  font-family: Roboto;
  text-transform: capitalize;
  height: 2.5rem;
  min-width: 2.5rem;
  font-size: 16px;
  padding: 0px;
  border: 0px rgb(123, 123, 123);
  box-sizing: border-box;
  background: ${props => (props.isSelected ? "rgb(226, 232, 240)" : "transparent")};
  overflow: visible;
  box-shadow: none !important;
  cursor: pointer;
  line-height: inherit;
  color: inherit;
  cursor: ${props => (!props.isDisabled ? "pointer" : "not-allowed")};
  opacity: ${props => (!props.isDisabled ? "1.0" : "0.4")};

  &:hover {
    ${props => (!props.isSelected && !props.isDisabled ? "background: rgb(237, 242, 247)" : "")}
  }
`;

type IconContainerProps = {
  fontSize?: string;
};
export const IconContainer = styled.div<IconContainerProps>`
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
  user-select: none;
  white-space: nowrap;
  font-weight: 400;
  font-style: normal;
  font-family: Roboto;
  text-transform: capitalize;
  font-size: ${props => props.fontSize || "1rem"};
  border-width: 0px;
  border-style: solid;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  line-height: 1em;
  flex-shrink: 0;
  color: currentcolor;
  vertical-align: middle;
  display: block;
`;

export const CloseButton = ({ onClick, isSelected, isDisabled }: IconButtonProps) => {
  return (
    <IconButton onClick={!isDisabled ? onClick : () => {}} isSelected={isSelected} isDisabled={isDisabled}>
      <IconContainer>
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path
            fill="currentColor"
            d="M.439,21.44a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,1,0,2.122-2.121L14.3,12.177a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.44L12.177,9.7a.25.25,0,0,1-.354,0L2.561.44A1.5,1.5,0,0,0,.439,2.561L9.7,11.823a.25.25,0,0,1,0,.354Z"
          ></path>
        </svg>
      </IconContainer>
    </IconButton>
  );
};

export const BackButton = ({ onClick, isSelected, isDisabled }: IconButtonProps) => {
  return (
    <IconButton onClick={!isDisabled ? onClick : () => {}} isSelected={isSelected} isDisabled={isDisabled}>
      <IconContainer>
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
        </svg>
      </IconContainer>
    </IconButton>
  );
};

/// ** MENU:
export const MenuButton = ({ onClick, isSelected }: IconButtonProps) => {
  return (
    <IconButton onClick={onClick} isSelected={isSelected} isDisabled={false}>
      <IconContainer>
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path
            fill="currentColor"
            d="M 3 5 A 1.0001 1.0001 0 1 0 3 7 L 21 7 A 1.0001 1.0001 0 1 0 21 5 L 3 5 z M 3 11 A 1.0001 1.0001 0 1 0 3 13 L 21 13 A 1.0001 1.0001 0 1 0 21 11 L 3 11 z M 3 17 A 1.0001 1.0001 0 1 0 3 19 L 21 19 A 1.0001 1.0001 0 1 0 21 17 L 3 17 z"
          ></path>
        </svg>
      </IconContainer>
    </IconButton>
  );
};
