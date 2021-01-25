import React, { FC } from 'react';
import { Typography, IconButton, MenuItem, Menu } from '@material-ui/core';

import { List } from 'react-feather';
import { TRANSFER_STATES, TransferStates, Screens } from '../constants';

const Options: FC<{
  transferState: TransferStates;
  setScreen: (screen: Screens) => any;
  activeScreen: Screens;
}> = ({ setScreen, activeScreen, transferState }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="more"
        disabled={[
          TRANSFER_STATES.DEPOSITING,
          TRANSFER_STATES.TRANSFERRING,
          TRANSFER_STATES.WITHDRAWING,
        ].includes(transferState as any)}
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <List />
      </IconButton>

      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            paddingLeft: '4px',
            paddingRight: '4px',
            marginTop: '40px',
            marginLeft: '20px',
          },
        }}
      >
        <MenuItem
          id="link"
          disabled={activeScreen === 'Home'}
          onClick={() => setScreen('Home')}
          alignItems="center"
        >
          Home
        </MenuItem>
        <br />
        <MenuItem
          id="link"
          disabled={activeScreen === 'Recover'}
          onClick={() => setScreen('Recover')}
          alignItems="center"
        >
          Recovery
        </MenuItem>
        <br />
        <MenuItem
          id="link"
          onClick={() =>
            window.open(
              'https://discord.com/channels/454734546869551114',
              '_blank'
            )
          }
          alignItems="center"
        >
          <Typography variant="inherit">Help</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Options;
