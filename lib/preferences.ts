import { AdminPreferences, UserPreferences } from './types/eureka'

export const DEFAULT_PREFERENCES: UserPreferences = {
  group_by_set: true,
  show_by_color: false,
  eureka_set_filter: null,
  eureka_category: null,
  eureka_obtained_filter: null,
  eureka_color: null,
  eureka_rarity: null,
  theme: 'system',
}

export const DEFAULT_ADMIN_PREFERENCES: AdminPreferences = {
  admin_view: 'list',
}
