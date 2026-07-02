'use client'

import { FieldConfig } from '@/lib/types/form-fields'
import { EurekaVariantRaw } from '@/lib/types/eureka'
import { trialFields } from './eureka/trials/fields'
import { eurekaVariantFields } from './eureka/variants/fields'
import { outfitVariantFields } from './outfits/variants/fields'
import { abilityFields } from './outfits/abilities/fields'
import { seasonCategoryFields } from './outfits/season-categories/fields'
import { seasonFields } from './outfits/seasons/fields'

/**
 * The admin field builders emit function-valued props (`slugFrom`, `required`,
 * `sortOptions`, …). Those functions can't cross the Server → Client boundary,
 * so pages must NOT call a builder and pass the result to `EntityForm`. Instead
 * a page passes a serializable `formKind` + `builderData`, and `EntityForm`
 * (client) calls this dispatcher so every closure is created on the client.
 */
export type FormKind =
  | 'trial'
  | 'eurekaVariant'
  | 'outfitVariant'
  | 'ability'
  | 'seasonCategory'
  | 'season'

/** Extra, serializable inputs a builder needs beyond `mode`. */
export interface BuilderData {
  /** eurekaVariant: existing variants used to detect an already-set default. */
  eurekaVariants?: EurekaVariantRaw[]
  /** eurekaVariant edit: the row being edited, excluded from the default check. */
  currentId?: number
}

export function buildFields(
  formKind: FormKind,
  mode: 'add' | 'edit',
  data: BuilderData = {}
): FieldConfig[] {
  switch (formKind) {
    case 'trial':
      return trialFields(mode)
    case 'eurekaVariant':
      return eurekaVariantFields(mode, data.eurekaVariants ?? [], data.currentId)
    case 'outfitVariant':
      return outfitVariantFields(mode)
    case 'ability':
      return abilityFields(mode)
    case 'seasonCategory':
      return seasonCategoryFields(mode)
    case 'season':
      return seasonFields(mode)
  }
}
