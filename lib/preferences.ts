import { AdminPreferences, UserPreferences } from './types/eureka'

export const DEFAULT_PREFERENCES: UserPreferences = {
  group_by_set: true,
  show_by_color: false,
  eureka_set_filter: null,
  eureka_category: null,
  eureka_obtained_filter: null,
  eureka_color: null,
  eureka_rarity: null,
  eureka_style: null,
  eureka_label: null,
  theme: 'system',
  color_theme: 'default',
  outfit_set_filter: null,
  outfit_category_filter: null,
  outfit_evolution_filter: null,
  outfit_rarity_filter: null,
  outfit_obtained_filter: null,
  outfit_style_filter: null,
  outfit_label_filter: null,
  outfit_group_by_set: true,
  outfit_hide_evolutions: false,
  outfit_hide_glowups: false,
  outfit_image_mode: 'image',
  outfit_density: 'standard',
  sort_order: 'new',
  outfit_sort_axis: 'date',
}

export const DEFAULT_ADMIN_PREFERENCES: AdminPreferences = {
  admin_view: 'list',
}
