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
  color_theme: 'default',
  outfit_set_filter: null,
  outfit_category_filter: null,
  outfit_evolution_filter: null,
  outfit_rarity_filter: null,
  outfit_obtained_filter: null,
  outfit_group_by_set: true,
  outfit_show_by_evolution: false,
  outfit_hide_evolutions: false,
  outfit_image_mode: 'image',
  outfit_density: 'standard',
}

export const DEFAULT_ADMIN_PREFERENCES: AdminPreferences = {
  admin_view: 'list',
}
