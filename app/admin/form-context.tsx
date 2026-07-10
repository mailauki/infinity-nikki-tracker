'use client'

import { createContext, useCallback, useContext, useState } from 'react'

export const ADMIN_DASHBOARD = '/admin'

interface FormConfig {
  formId: string
  pending: boolean
  showAddAnother?: boolean
  showUpdateOnly?: boolean
  showUpdateNext?: boolean
  savedTitle?: string
}

interface FormContextValue extends FormConfig {
  setFormConfig: (config: Partial<FormConfig>) => void
}

const FormContext = createContext<FormContextValue>({
  formId: '',
  pending: false,
  showAddAnother: false,
  showUpdateOnly: false,
  showUpdateNext: false,
  savedTitle: undefined,
  setFormConfig: () => {},
})

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FormConfig>({
    formId: '',
    pending: false,
    showAddAnother: false,
    showUpdateOnly: false,
    showUpdateNext: false,
    savedTitle: undefined,
  })

  const setFormConfig = useCallback((updates: Partial<FormConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  return <FormContext value={{ ...config, setFormConfig }}>{children}</FormContext>
}

export function useFormConfig() {
  return useContext(FormContext)
}
