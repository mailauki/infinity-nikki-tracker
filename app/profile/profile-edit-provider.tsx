'use client'

import { useState } from 'react'
import { ProfileEditContext } from './profile-context'

export default function ProfileEditProvider({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  return (
    <ProfileEditContext.Provider value={{ isEditing, setIsEditing }}>
      {children}
    </ProfileEditContext.Provider>
  )
}
