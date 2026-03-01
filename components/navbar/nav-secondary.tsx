import Link from 'next/link'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { NavSecondaryLink } from '@/lib/types/types'

export function NavSecondary({ items, open }: { items: NavSecondaryLink[]; open: boolean }) {
  return (
    <List>
      {items.map((item) => (
        <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
          <Tooltip title={open ? '' : item.title} placement="right">
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
          </Tooltip>
        </ListItem>
      ))}
    </List>
  )
}
