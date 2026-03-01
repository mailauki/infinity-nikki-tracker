import Link from 'next/link'
import ImageIcon from '@mui/icons-material/Image'

import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  useTheme,
} from '@mui/material'
import React from 'react'
import { NavMainLink } from '@/lib/types/types'

export function NavMain({ items, open = false }: { items: NavMainLink[]; open?: boolean }) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'

  return (
    <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }} component="nav">
      {items.map((item) => (
        <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            component={Link}
            href={item.url}
            sx={[
              {
                minHeight: 48,
                px: 2.5,
              },
              open
                ? {
                    justifyContent: 'initial',
                  }
                : {
                    justifyContent: 'center',
                  },
            ]}
          >
            <ListItemAvatar
              sx={[
                {
                  minWidth: 0,
                  justifyContent: 'center',
                },
                open
                  ? {
                      mr: 1.5,
                    }
                  : {
                      mr: 'auto',
                    },
              ]}
            >
              <Avatar
                src={item.image}
                alt={item.title}
                sx={{ filter: isDarkMode ? 'none' : 'brightness(40%)' }}
                className="dark:brightness-40 filter-none"
              >
                <ImageIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={item.title}
              sx={[
                open
                  ? {
                      opacity: 1,
                    }
                  : {
                      opacity: 0,
                    },
              ]}
            />
          </ListItemButton>
          {item.items?.length && open ? (
            <List disablePadding>
              {item.items?.map((subItem) => (
                <ListItem key={subItem.title} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton component={Link} href={subItem.url}>
                    <ListItemText inset primary={subItem.title} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : null}
        </ListItem>
      ))}
    </List>
  )
}
