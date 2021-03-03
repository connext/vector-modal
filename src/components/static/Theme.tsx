import React from 'react';
import styled from 'styled-components';
import { useWindowDimensions } from './utils';

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

const IconBox = styled.div`
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
  font-size: 1.25rem;
  font-weight: 600;
  border-width: 0px;
  border-style: solid;
  box-sizing: border-box;
  width: 1em;
  height: 1em;
  line-height: 1em;
  flex-shrink: 0;
  color: currentcolor;
  vertical-align: middle;
  display: block;
`;

export const WarningIcon = () => {
  return (
    <IconBox>
      <svg viewBox="0 0 24 24" focusable="false">
        <path fill="currentColor" d="M23.119,20,13.772,2.15h0a2,2,0,0,0-3.543,0L.881,20a2,2,0,0,0,1.772,2.928H21.347A2,2,0,0,0,23.119,20ZM11,8.423a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Zm1.05,11.51h-.028a1.528,1.528,0,0,1-1.522-1.47,1.476,1.476,0,0,1,1.448-1.53h.028A1.527,1.527,0,0,1,13.5,18.4,1.475,1.475,0,0,1,12.05,19.933Z"></path>
      </svg>
    </IconBox>
  );
};

type IconButtonProps = {
  onClick: (e?: React.MouseEvent) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
};

const IconButton = styled.button<IconButtonProps>`
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
  background: ${props => props.isSelected ? "rgb(226, 232, 240)" : "transparent"};
  overflow: visible;
  box-shadow: none !important;
  cursor: pointer;
  line-height: inherit;
  color: inherit;
  cursor: ${props => !props.isDisabled ? "pointer" : "not-allowed"};
  opacity: ${props => !props.isDisabled ? "1.0" : "0.4"};

  &::hover {
    ${props => !props.isSelected && !props.isDisabled ? "background: rgb(237, 242, 247)" : ""}
  }
`;

const IconContainer = styled.div`
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
  user-select: none;
  white-space: nowrap;
  font-weight: 400;
  font-style: normal;
  font-family: Roboto;
  text-transform: capitalize;
  font-size: 16px;
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
          <path fill="currentColor" d="M.439,21.44a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,1,0,2.122-2.121L14.3,12.177a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.44L12.177,9.7a.25.25,0,0,1-.354,0L2.561.44A1.5,1.5,0,0,0,.439,2.561L9.7,11.823a.25.25,0,0,1,0,.354Z"></path>
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
          <path fill="currentColor" d="M 3 5 A 1.0001 1.0001 0 1 0 3 7 L 21 7 A 1.0001 1.0001 0 1 0 21 5 L 3 5 z M 3 11 A 1.0001 1.0001 0 1 0 3 13 L 21 13 A 1.0001 1.0001 0 1 0 21 11 L 3 11 z M 3 17 A 1.0001 1.0001 0 1 0 3 19 L 21 19 A 1.0001 1.0001 0 1 0 21 17 L 3 17 z"></path>
        </svg>
      </IconContainer>
    </IconButton>
  );
};

/// NOTE: MenuListPositioner contains MenuListContainer. This arrangement is a temporary solution in
/// reverse engineering previous framework UI.
type MenuListPositionerProps = {
  hidden: boolean;
  placement: string;
};

const MenuListPositioner = styled.div<MenuListPositionerProps>`
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
  color: inherit;
  font-size: 1.25rem;
  font-weight: 600;
  border-width: 0px;
  border-style: solid;
  box-sizing: border-box;
  z-index: 1;
  position: absolute;
  inset: 0px auto auto 0px;
  visibility: ${props => props.hidden ? "hidden" : "visible"};
  transform: ${props => props.placement == "bottom-start" ? "translate3d(372px, 72px, 0px)" : "translate3d(188px, 72px, 0px)"};
`;

type MenuListProps = {
  children?: React.ReactNode;
  hidden: boolean;
};

const MenuListContainer = styled.div<MenuListProps>`
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
  font-size: 1.25rem;
  font-weight: 600;
  box-sizing: border-box;
  outline: 0px;
  background: rgb(255, 255, 255);
  box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
  color: inherit;
  min-width: 14rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  z-index: 1;
  border-radius: 0.375rem;
  border: 0px;
  transform-origin: left top;
  opacity: ${props => props.hidden ? "0" : "1"};
  visibility: ${props => props.hidden ? "hidden" : "visible"};
  transform: ${props => props.hidden ? "scale(0.8) translateZ(0px)" : "none"};
`;

export const MenuList = ({ children, hidden }: MenuListProps) => {
  const { width } = useWindowDimensions();
  return (
    <MenuListPositioner hidden={hidden} placement={width > 765 ? "bottom-start" : "bottom-end"}>
      <MenuListContainer hidden={hidden}>{children}</MenuListContainer>
    </MenuListPositioner>
  );
};

type MenuItemProps = {
  children?: React.ReactNode | string,
  onClick: (e?: React.MouseEvent) => void,
  isDisabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const MenuItemButton = styled.button<MenuItemProps>`
  -webkit-font-smoothing: antialiased;
  --removed-body-scroll-bar-size: 0px;
  visibility: visible;
  border-width: 0px;
  border-style: solid;
  box-sizing: border-box;
  text-decoration: none;
  user-select: none;
  display: flex;
  width: 100%;
  align-items: center;
  text-align: left;
  flex: 0 0 auto;
  outline: 0px;
  padding: 0.4rem 0.8rem;
  transition: background 50ms ease-in 0s;
  font-size: 20px;
  background: transparent;
  overflow: visible;
  box-shadow: none !important;
  line-height: inherit;
  color: inherit;
  cursor: ${props => !props.isDisabled ? "pointer" : "not-allowed"};
  opacity: ${props => !props.isDisabled ? "1.0" : "0.4"};
`;

export const MenuItem = ({ onClick, children, isDisabled }: MenuItemProps) => {
  return (
    <MenuItemButton onClick={onClick} isDisabled={isDisabled}>{children}</MenuItemButton>
  );
};
