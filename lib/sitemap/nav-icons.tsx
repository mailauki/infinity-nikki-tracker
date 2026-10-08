import {
  AccountCircle,
  AdminPanelSettings,
  Book,
  Checkroom,
  Construction,
  Help,
  Info,
  Settings,
} from '@mui/icons-material'
import type { SvgIconProps } from '@mui/material'
import type { NavIconKey } from './page-titles'

// The one place nav icon keys become MUI components. Kept out of page-titles.ts
// so the registry stays plain data that server code can import.
const NAV_ICONS = {
  account: AccountCircle,
  admin: AdminPanelSettings,
  checkroom: Checkroom,
  construction: Construction,
  book: Book,
  help: Help,
  info: Info,
  settings: Settings,
} satisfies Record<NavIconKey, unknown>

export function NavIcon({ name, ...props }: { name: NavIconKey } & SvgIconProps) {
  const Icon = NAV_ICONS[name]
  return <Icon {...props} />
}
