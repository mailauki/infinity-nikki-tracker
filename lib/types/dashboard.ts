export type EurekaSetRow = {
  id: number
  slug: string | null
  name: string
  quality: number | null
  style: string | null
  labels: string | null
  trial: string | null
  updated_at: string | null
}

export type EurekaVariantRow = {
  id: number
  slug: string | null
  eureka_set: string | null
  category: string | null
  color: string | null
  image_url: string | null
  default: boolean
  updated_at: string | null
}

export type TrialRow = {
  id: number
  slug: string | null
  name: string
  image_url: string | null
  [key: string]: unknown
}

export interface DashboardTabsProps {
  eurekaSets: EurekaSetRow[]
  eurekaVariants: EurekaVariantRow[]
  trials: TrialRow[]
}