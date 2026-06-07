'use client'
import LazyAvatar from '@/components/lazy-avatar'
import { navLinksData } from '@/lib/nav-links'
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'

type Props = {
  tab: string
  item: string
  onTabChange: (tab: string) => void
  onItemChange: (item: string) => void
}

export default function AdminRecentsToggle({ tab, item, onTabChange, onItemChange }: Props) {
  const currentTab = navLinksData.admin.tabs.find((t) => t.title === tab)

  return (
    <Stack direction="row" spacing={1} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>
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
          <ToggleButton key={t.title} value={t.title}>
            <LazyAvatar alt={t.title} src={t.image} size="xs" />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={item}
        onChange={(_, v) => {
          if (!v) return
          onItemChange(v)
        }}
      >
        {currentTab?.items?.map((i) => (
          <ToggleButton key={i.title} value={i.title}>
            {i.title}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
