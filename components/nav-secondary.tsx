import Link from 'next/link'
import { JSX } from 'react'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

export function NavSecondary({
  items,
  open,
}: {
  items: {
    title: string
    url: string
    icon: JSX.Element
  }[]
  open: boolean
}) {
  return (
    <List>
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
            <ListItemIcon
              sx={[
                {
                  minWidth: 0,
                  justifyContent: 'center',
                },
                open
                  ? {
                      mr: 3.5,
                    }
                  : {
                      mr: 'auto',
                    },
              ]}
            >
              {item.icon}
            </ListItemIcon>
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
        </ListItem>
      ))}
    </List>
  )
}