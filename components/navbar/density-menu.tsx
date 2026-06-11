'use client'
import { Compare, ViewCompact, ViewList, ViewModule } from "@mui/icons-material";
import { Divider, IconButton, ListItemIcon, Menu, MenuItem, MenuList, Tooltip } from "@mui/material";
import React from "react";

export default function DensityMenu() {
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
			<Tooltip title='View Density'>
				<IconButton onClick={handleClick}>
					<ViewModule />
				</IconButton>
			</Tooltip>

			<Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        id="view-density-menu"
        open={open}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        onClick={handleClose}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ViewModule />
          </ListItemIcon>
          Standard
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ViewCompact />
          </ListItemIcon>
          Compact
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ViewList />
          </ListItemIcon>
          List
        </MenuItem>
				<Divider />
				<MenuItem onClick={handleClose}>
					<ListItemIcon>
            <Compare />
					</ListItemIcon>
          Alt Images
				</MenuItem>
      </Menu>
		</>
	)
}