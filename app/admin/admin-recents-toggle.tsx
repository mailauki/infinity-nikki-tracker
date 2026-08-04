'use client'
import { useId, useState } from 'react'
import ToggleIcon from '@/components/toggle-icon'
import { navLinksData } from '@/lib/nav-links'
import { MoreHoriz } from '@mui/icons-material'
import {
  CardContent,
  CardHeader,
  Menu,
  MenuItem,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'

const VISIBLE_ITEM_COUNT = 3
const OVERFLOW_VALUE = '__overflow__'

type Props = {
  title: string
  item: string
  tab: string
  onItemChange: (item: string) => void
  onTabChange: (tab: string) => void
}

export default function AdminRecentsToggle({ title, item, tab, onItemChange, onTabChange }: Props) {
  const id = useId()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isMenuOpen = Boolean(anchorEl)

  const currentTab = navLinksData.admin.tabs.find((t) => t.title === tab)
  const items = currentTab?.items ?? []

  // A selected item from the overflow would otherwise render no pressed toggle, so promote
  // it into the visible row (swapping out the last slot) and keep the count at three.
  const selectedIndex = items.findIndex((i) => i.title === item)
  const isSelectionHidden = selectedIndex >= VISIBLE_ITEM_COUNT
  const visibleItems = isSelectionHidden
    ? [...items.slice(0, VISIBLE_ITEM_COUNT - 1), items[selectedIndex]]
    : items.slice(0, VISIBLE_ITEM_COUNT)
  const overflowItems = items.filter((i) => !visibleItems.includes(i))

  return (
    <>
      <CardHeader
        disableTypography
        action={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={tab}
            onChange={(_, v) => {
              if (!v) return
              onTabChange(v)
              const firstItem = navLinksData.admin.tabs.find((t) => t.title === v)?.items?.[0]
              if (firstItem) onItemChange(firstItem.title)
            }}
          >
            {navLinksData.admin.tabs.map((t) => (
              <Tooltip key={t.title} title={t.title}>
                <ToggleButton size="small" value={t.title}>
                  <ToggleIcon
                    image={t.image}
                    isSelected={tab === t.title}
                    size="xs"
                    title={t.title}
                  />
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        }
        sx={{ pb: 0 }}
        title={
          <Typography color="text.secondary" variant="overline">
            {title}
          </Typography>
        }
      />
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={item}
            onChange={(_, v) => {
              // The overflow trigger lives inside the exclusive group, so its value
              // reaches onChange too — it opens the menu instead of becoming the filter.
              if (!v || v === OVERFLOW_VALUE) return
              onItemChange(v)
            }}
          >
            {visibleItems.map((i) => (
              <ToggleButton key={i.title} size="small" value={i.title}>
                {i.title}
              </ToggleButton>
            ))}
            {/* Keep the row to three toggles; the rest stay reachable via the overflow
                menu rather than wrapping onto a second line. The selected item is pulled
                into view above so the current filter is never hidden behind the menu. */}
            {overflowItems.length > 0 && (
              <ToggleButton
                aria-controls={isMenuOpen ? `${id}-overflow-menu` : undefined}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                aria-label="More sections"
                id={`${id}-overflow-button`}
                size="small"
                value={OVERFLOW_VALUE}
                onClick={(event) => setAnchorEl(event.currentTarget)}
              >
                <MoreHoriz fontSize="small" />
              </ToggleButton>
            )}
          </ToggleButtonGroup>
          <Menu
            disableScrollLock
            anchorEl={anchorEl}
            id={`${id}-overflow-menu`}
            open={isMenuOpen}
            slotProps={{ list: { 'aria-labelledby': `${id}-overflow-button` } }}
            onClose={() => setAnchorEl(null)}
          >
            {overflowItems.map((i) => (
              <MenuItem
                key={i.title}
                selected={i.title === item}
                onClick={() => {
                  onItemChange(i.title)
                  setAnchorEl(null)
                }}
              >
                {i.title}
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </CardContent>
    </>
  )
}
