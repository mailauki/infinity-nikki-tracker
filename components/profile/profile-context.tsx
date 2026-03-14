'use client'

import { createContext, useContext } from 'react'

interface ProfileEditContextValue {
  isEditing: boolean
  setIsEditing: (v: boolean) => void
}

export const ProfileEditContext = createContext<ProfileEditContextValue | null>(null)

export function useProfileEdit() {
  return useContext(ProfileEditContext)
}
