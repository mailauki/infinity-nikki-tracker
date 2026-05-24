'use client'

import { createContext, useContext } from 'react'

import { Category, Color, EurekaSet, Trial } from '@/lib/types/eureka'

interface EurekaDataContextValue {
  eurekaSets: EurekaSet[]
  categories: Category[]
  colors: Color[]
  trials: Trial[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  userId: string | null
  groupBySet: boolean
  showByColor: boolean
  onGroupBySetChange: () => void
  onShowByColorChange: () => void
}

export const EurekaDataContext = createContext<EurekaDataContextValue>({
  eurekaSets: [],
  categories: [],
  colors: [],
  trials: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  userId: null,
  groupBySet: true,
  showByColor: false,
  onGroupBySetChange: () => {},
  onShowByColorChange: () => {},
})

export function useEurekaData() {
  return useContext(EurekaDataContext)
}
