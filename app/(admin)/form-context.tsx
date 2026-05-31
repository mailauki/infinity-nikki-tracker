'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface FormConfig {
  formId: string
  backUrl: string
  pending: boolean
}

interface FormContextValue extends FormConfig {
  setFormConfig: (config: Partial<FormConfig>) => void
}

const FormContext = createContext<FormContextValue>({
  formId: '',
  backUrl: '',
  pending: false,
  setFormConfig: () => {},
})

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FormConfig>({ formId: '', backUrl: '', pending: false })

  const setFormConfig = useCallback((updates: Partial<FormConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  return <FormContext value={{ ...config, setFormConfig }}>{children}</FormContext>
}

export function useFormConfig() {
  return useContext(FormContext)
}
