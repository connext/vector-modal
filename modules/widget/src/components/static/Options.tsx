import React, { FC, useState } from "react";

import { MenuList, MenuItem, MenuButton } from "../common";
import { ScreenStates, SCREEN_STATES, ERROR_STATES } from "../../constants";

interface OptionsProps {
  state: ScreenStates;
  onClose: () => void;
  handleSetState: (screenState: ScreenStates) => void;
  handleUserInfoButton: () => void;
}

const Options: FC<OptionsProps> = props => {
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const { state, onClose, handleSetState, handleUserInfoButton } = props;
  return (
    <>
      <div>
        <MenuButton onClick={() => setIsListOpen(!isListOpen)} isSelected={!!isListOpen} />
        <MenuList hidden={!isListOpen}>
          <MenuItem
            onClick={() => {
              handleSetState(SCREEN_STATES.SWAP);
            }}
            disabled={
              [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS, ...Object.values(ERROR_STATES)].includes(state as any)
                ? true
                : false
            }
          >
            Home
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleSetState(SCREEN_STATES.RECOVER);
            }}
            disabled={
              [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS, ...Object.values(ERROR_STATES)].includes(state as any)
                ? true
                : false
            }
          >
            Recovery
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleSetState(SCREEN_STATES.HISTORY);
            }}
            disabled={[SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(state as any) ? true : false}
          >
            Transfer History
          </MenuItem>
          <MenuItem onClick={() => window.open("https://support.connext.network", "_blank")}>Support</MenuItem>
          <MenuItem
            disabled={[SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(state as any) ? true : false}
            onClick={handleUserInfoButton}
          >
            User Info
          </MenuItem>
          <MenuItem
            disabled={[SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(state as any) ? true : false}
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
