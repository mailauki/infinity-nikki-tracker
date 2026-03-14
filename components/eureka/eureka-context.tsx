'use client'

import { createContext, useContext } from 'react'

import { Category, Color, EurekaSet, Trial } from '@/lib/types/eureka'

interface EurekaDataContextValue {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  trials: Trial[]
  isLoggedIn: boolean
  isLoading: boolean
  userId: string | null
}

export const EurekaDataContext = createContext<EurekaDataContextValue>({
  eurekaSets: [],
  categories: [],
  colors: [],
  trials: [],
  isLoggedIn: false,
  isLoading: true,
  userId: null,
})

export function useEurekaData() {
  return useContext(EurekaDataContext)
}
