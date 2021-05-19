import React, { FC, useState } from "react";

import { MenuList, MenuItem, MenuButton } from "../common";
import { ScreenStates, SCREEN_STATES, ERROR_STATES } from "../../constants";

interface OptionsProps {
  state: ScreenStates;
  onClose: () => void;
  handleRecoveryButton: () => void;
  handleUserInfoButton: () => void;
}

const Options: FC<OptionsProps> = props => {
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const { state, onClose, handleRecoveryButton, handleUserInfoButton } = props;
  return (
    <>
      <div>
        <MenuButton onClick={() => setIsListOpen(!isListOpen)} isSelected={!!isListOpen} />
        <MenuList hidden={!isListOpen}>
          <MenuItem
            // fontSize="20px"
            // background="transparent"
            onClick={handleRecoveryButton}
            isDisabled={
              [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS, ...Object.values(ERROR_STATES)].includes(state as any)
                ? true
                : false
            }
          >
            {state === SCREEN_STATES.RECOVER ? "Home" : "Recovery"}
          </MenuItem>
          <MenuItem onClick={() => window.open("https://discord.gg/AGpyHSbYCe", "_blank")}>Support</MenuItem>
          <MenuItem
            isDisabled={
              [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS, ...Object.values(ERROR_STATES)].includes(state as any)
                ? true
                : false
            }
            onClick={handleUserInfoButton}
          >
            User Info
          </MenuItem>
          <MenuItem
            isDisabled={[SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(state as any) ? true : false}
            onClick={onClose}
          >
            Close
          </MenuItem>
        </MenuList>
      </div>
    </>
  );
};

export default Options;
