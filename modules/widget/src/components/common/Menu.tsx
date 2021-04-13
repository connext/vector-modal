import React, { useState, useEffect } from "react";
import styled from "styled-components";

/// NOTE: MenuListPositioner contains MenuListContainer. This arrangement is a temporary solution in
/// reverse engineering previous framework UI.
type MenuListPositionerProps = {
  hidden: boolean;
  placement: string;
};

const MenuListPositioner = styled.div<MenuListPositionerProps>`
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
  visibility: ${props => (props.hidden ? "hidden" : "visible")};
  transform: ${props =>
    props.placement === "bottom-start" ? "translate3d(372px, 72px, 0px)" : "translate3d(188px, 72px, 0px)"};
`;

type MenuListProps = {
  children?: React.ReactNode;
  hidden: boolean;
};

const MenuListContainer = styled.div<MenuListProps>`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans",
    "Droid Sans", "Helvetica Neue", sans-serif;
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
  opacity: ${props => (props.hidden ? "0" : "1")};
  visibility: ${props => (props.hidden ? "hidden" : "visible")};
  transform: ${props => (props.hidden ? "scale(0.8) translateZ(0px)" : "none")};
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
  children?: React.ReactNode | string;
  onClick: (e?: React.MouseEvent) => void;
  isDisabled?: boolean;
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
  cursor: ${props => (!props.isDisabled ? "pointer" : "not-allowed")};
  opacity: ${props => (!props.isDisabled ? "1.0" : "0.4")};
`;

export const MenuItem = ({ onClick, children, isDisabled }: MenuItemProps) => {
  return (
    <MenuItemButton onClick={onClick} isDisabled={isDisabled}>
      {children}
    </MenuItemButton>
  );
};

// utils

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}
