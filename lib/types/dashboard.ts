import { EurekaSetRaw, EurekaVariantRaw, Trial } from './eureka'

export interface DashboardTabsProps {
  eurekaSets: EurekaSetRaw[]
  eurekaVariants: EurekaVariantRaw[]
  trials: Trial[]
}
