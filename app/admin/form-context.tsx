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
  /**
   * Release the toolbar, but only if `formId` still owns it. A form calls this
   * on unmount; the ownership check means a late-running cleanup can never wipe
   * the registration a newly mounted form has already made.
   */
  clearFormConfig: (formId: string) => void
}

const FormContext = createContext<FormContextValue>({
  formId: '',
  pending: false,
  showAddAnother: false,
  showUpdateOnly: false,
  showUpdateNext: false,
  savedTitle: undefined,
  setFormConfig: () => {},
  clearFormConfig: () => {},
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

  const clearFormConfig = useCallback((formId: string) => {
    setConfig((prev) =>
      // Someone else already claimed the toolbar — leave their registration alone.
      prev.formId !== formId
        ? prev
        : {
            formId: '',
            pending: false,
            showAddAnother: false,
            showUpdateOnly: false,
            showUpdateNext: false,
            savedTitle: prev.savedTitle,
          }
    )
  }, [])

  return <FormContext value={{ ...config, setFormConfig, clearFormConfig }}>{children}</FormContext>
}

export function useFormConfig() {
  return useContext(FormContext)
}
