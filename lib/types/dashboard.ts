import { Tables } from './supabase'
import { Trial } from './eureka'

export interface DashboardTabsProps {
  eurekaSets: Tables<'eureka_sets'>[]
  eurekaVariants: Tables<'eureka_variants'>[]
  trials: Trial[]
}
