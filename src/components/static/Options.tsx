import React, { FC } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { ScreenStates, SCREEN_STATES, ERROR_STATES } from '../../constants';

interface OptionsProps {
  state: ScreenStates;
  onClose: () => void;
  handleRecoveryButton: () => void;
}

const Options: FC<OptionsProps> = props => {
  const { state, onClose, handleRecoveryButton } = props;
  return (
    <>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Options"
          border="none"
          bg="transparent"
          icon={<HamburgerIcon boxSize={6} />}
        />
        <MenuList border="none">
          <MenuItem
            fontSize="20px"
            background="transparent"
            onClick={handleRecoveryButton}
            isDisabled={
              [
                SCREEN_STATES.LOADING,
                SCREEN_STATES.STATUS,
                ...Object.values(ERROR_STATES),
              ].includes(state as any)
                ? true
                : false
            }
          >
            {' '}
            {state == SCREEN_STATES.RECOVERY ? 'Home' : 'Recovery'}{' '}
          </MenuItem>

          <MenuItem
            fontSize="20px"
            background="transparent"
            icon={<ExternalLinkIcon />}
            onClick={() =>
              window.open(
                'https://discord.com/channels/454734546869551114',
                '_blank'
              )
            }
          >
            Support
          </MenuItem>
          <MenuItem
            fontSize="20px"
            background="transparent"
            icon={<CloseIcon />}
            isDisabled={
              [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(
                state as any
              )
                ? true
                : false
            }
            onClick={onClose}
          >
            Close
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};

export default Options;
