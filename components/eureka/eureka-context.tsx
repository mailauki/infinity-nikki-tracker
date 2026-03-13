'use client'

import { createContext, useContext } from 'react'

import { Category, Color, EurekaSet } from '@/lib/types/eureka'

interface EurekaDataContextValue {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  isLoggedIn: boolean
  userId: string | null
}

export const EurekaDataContext = createContext<EurekaDataContextValue>({
  eurekaSets: [],
  categories: [],
  colors: [],
  isLoggedIn: false,
  userId: null,
})

export function useEurekaData() {
  return useContext(EurekaDataContext)
}
