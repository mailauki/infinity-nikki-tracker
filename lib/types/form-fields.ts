import { AvatarSize } from '@/lib/types/props'
import { ImageUploadTable } from '@/components/forms/image-upload'

/** The live values of a form, keyed by field name. */
export type FieldValues = Record<string, unknown>

/** An option for select/toggle/multiSelect fields — matches the lookup-hook shape. */
export type FieldOption = { slug: string; title: string | null; [key: string]: unknown }

/** Lookup data passed to the engine, indexed by a field's `optionsKey`. */
export type FieldLookups = Record<string, FieldOption[]>

/**
 * Shared props on every field. The function-valued escape hatches let simple
 * forms stay declarative while medium forms (e.g. the eureka-variant default
 * switch) compute state from the current values.
 */
interface BaseField {
  name: string
  label?: string
  required?: boolean | ((values: FieldValues) => boolean)
  helperText?: string | ((values: FieldValues) => string)
  disabled?: boolean | ((values: FieldValues) => boolean)
  /** Return true to omit the field entirely for the current values. */
  hidden?: (values: FieldValues) => boolean
}

interface TextField extends BaseField {
  type: 'text'
  defaultValue?: string
}

interface TextareaField extends BaseField {
  type: 'textarea'
  minRows?: number
  defaultValue?: string
}

interface SlugField extends BaseField {
  type: 'slug'
  /**
   * How to derive the slug while the user hasn't manually edited it. A string
   * names the source value (default `'title'`, via `toSlug`); a function
   * builds a composite (e.g. `toSlugVariant(set, category, color)`).
   */
  slugFrom?: string | ((values: FieldValues) => string)
  /**
   * Auto-derive the slug in edit mode too. Off by default: an existing record's
   * slug is a stable identifier (and image-storage key), so editing other
   * fields must not silently rewrite it. Opt in only where the slug is meant to
   * track its sources live (e.g. eureka variants).
   */
  deriveOnEdit?: boolean
}

interface SelectField extends BaseField {
  type: 'select'
  optionsKey: string
  /** Render a leading "—" (empty → null) option. Defaults to true. */
  includeEmpty?: boolean
  sortOptions?: (a: FieldOption, b: FieldOption) => number
}

interface MultiSelectField extends BaseField {
  type: 'multiSelect'
  optionsKey: string
  max?: number
  sortOptions?: (a: FieldOption, b: FieldOption) => number
}

interface ImageField extends BaseField {
  type: 'image'
  table: ImageUploadTable
  size?: AvatarSize
  column?: string
  caption?: string
}

interface ImagePairField extends BaseField {
  type: 'imagePair'
  table: ImageUploadTable
  size?: AvatarSize
  /** FormData key for the default image's hidden input. */
  hiddenInputName?: string
  /** Value key holding the alt image. Defaults to `${name}_alt`. */
  altName?: string
}

interface SwitchField extends BaseField {
  type: 'switch'
}

interface RarityField extends BaseField {
  type: 'rarity'
}

interface ToggleField extends BaseField {
  type: 'toggle'
  optionsKey: string
}

/** Names of the client-side custom field components EntityForm knows how to render. */
export type CustomFieldComponent = 'groupedOutfitSet' | 'labelPair'

interface CustomField extends BaseField {
  type: 'custom'
  /**
   * A `custom` field must stay serializable so `fields.tsx` can be built in a
   * Server Component and passed to the client `EntityForm`. Instead of a render
   * closure (a function can't cross the RSC boundary), it names a component that
   * `EntityForm` maps to the real client component.
   */
  component: CustomFieldComponent
}

export type FieldConfig =
  | TextField
  | TextareaField
  | SlugField
  | SelectField
  | MultiSelectField
  | ImageField
  | ImagePairField
  | SwitchField
  | RarityField
  | ToggleField
  | CustomField
