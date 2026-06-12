'use client'
import { Check, Compare, ViewCompact, ViewModule } from '@mui/icons-material'
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import React from 'react'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'

export default function DensityMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const { mode, cycleMode, density, setDensity } = useOutfitImageMode()
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const IMAGE_MODE_LABEL = {
    image: 'Showing main image',
    alt: 'Showing alternate image',
    poster: 'Showing poster image',
  } as const

  return (
    <>
      <Tooltip title="View Density">
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
        <MenuItem
          selected={density === 'standard'}
          onClick={() => {
            setDensity('standard')
            handleClose()
          }}
        >
          <ListItemIcon>
            <ViewModule />
          </ListItemIcon>
          <ListItemText>Standard</ListItemText>
          {density === 'standard' && <Check fontSize="small" sx={{ ml: 2 }} />}
        </MenuItem>
        <MenuItem
          selected={density === 'compact'}
          onClick={() => {
            setDensity('compact')
            handleClose()
          }}
        >
          <ListItemIcon>
            <ViewCompact />
          </ListItemIcon>
          <ListItemText>Compact</ListItemText>
          {density === 'compact' && <Check fontSize="small" sx={{ ml: 2 }} />}
        </MenuItem>
        {/* <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ViewList />
          </ListItemIcon>
          List
          {density === 'list' && <Check fontSize="small" sx={{ ml: 2 }} />}
        </MenuItem> */}
        {/* TODO: list view density will be added later */}
        <Divider />
        <MenuItem onClick={cycleMode}>
          <ListItemIcon>
            <Compare />
          </ListItemIcon>
          {IMAGE_MODE_LABEL[mode]}
        </MenuItem>
      </Menu>
    </>
  )
}
