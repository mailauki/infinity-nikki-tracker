export interface EurekaSet {
  id: number
  slug: string
  name: string
  quality: number | null
  style: string | null
  labels: string | null
  trial: string | null
  image_url: string
  eureka: Eureka[]
  categories: Category[]
  colors: Category[]
}

export interface Eureka {
  id: number
  eureka_set: string | null
  color: string | null
  category: string | null
  image_url: string | null
  default: boolean
  obtained?: boolean
}

export interface ObtainedCount {
  obtained: number
  total: number
}

export interface Category {
  name: string
  image_url: string | null
}

export interface Total {
  name: string
  image_url: string | null
  eurekaSets?: EurekaSet[]
}

export interface Obtained {
  id: number
  eureka_set: string | null
  category: string | null
  color: string | null
}

export interface EurekaSets {
  id: number
  slug: string | null
  name: string
  quality: number | null
  style: string | null
  labels: string | null
  trial: string | null
  eureka: {
    id: number
    eureka_set: string | null
    color: string | null
    category: string | null
    image_url: string | null
    default: boolean
  }[]
}
