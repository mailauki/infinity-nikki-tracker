'use client'

import { createContext, useContext } from 'react'

interface ProfileEditContextValue {
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
}

export const ProfileEditContext = createContext<ProfileEditContextValue | null>(null)

export function useProfileEdit() {
  return useContext(ProfileEditContext)
}
