'use client'

import { Box, Stack, Tooltip } from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import { GridColDef, GridValidRowModel } from '@mui/x-data-grid'
import { OutfitCategory, OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import ImageUpload from '@/components/forms/image-upload'

type CellVariant = Pick<OutfitVariant, 'id' | 'slug' | 'image_url' | 'alt_image_url'>

// Renders the image + alt-image uploaders for a single category of one set or
// evolution row. When the row has no variant in this category (the set doesn't
// use it), the cell is locked: a disabled placeholder instead of uploaders.
// Used as a per-category column in the outfit set and evolution admin tables.
export default function VariantImageCell({
  variant,
  onUpload,
}: {
  variant: CellVariant | null
  onUpload: (variantId: number, column: 'image_url' | 'alt_image_url', url: string) => void
}) {
  if (!variant) {
    return (
      <Tooltip title="Not part of this set">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'text.disabled',
          }}
        >
          <BlockIcon fontSize="small" />
        </Box>
      </Tooltip>
    )
  }

  return (
    <Stack direction="row" sx={{ gap: 0.5, py: 0.5, justifyContent: 'center' }}>
      <ImageUpload
        column="image_url"
        size="xs"
        slug={variant.slug ?? undefined}
        table="outfit_variants"
        url={variant.image_url ?? null}
        onUpload={(url) => onUpload(variant.id, 'image_url', url)}
      />
      <ImageUpload
        column="alt_image_url"
        size="xs"
        slug={variant.slug ?? undefined}
        table="outfit_variants"
        url={variant.alt_image_url ?? null}
        onUpload={(url) => onUpload(variant.id, 'alt_image_url', url)}
      />
    </Stack>
  )
}

// Builds one DataGrid column per outfit category, each rendering that row's
// image + alt uploaders for the category (or a locked cell when the row has no
// variant there). Shared by the outfit set and evolution admin tables.
export function categoryImageColumns<Row extends GridValidRowModel>({
  outfitCategories,
  getVariant,
  onUpload,
}: {
  outfitCategories: OutfitCategory[]
  // Returns the row's variant for the given category, or null if absent.
  getVariant: (row: Row, categorySlug: string) => CellVariant | null
  onUpload: (
    row: Row,
    variantId: number,
    column: 'image_url' | 'alt_image_url',
    url: string
  ) => void
}): GridColDef<Row>[] {
  return outfitCategories.map((category) => ({
    field: `variant_${category.slug}`,
    headerName: category.title ?? toTitle(category.slug),
    width: 96,
    sortable: false,
    renderCell: ({ row }) => (
      <VariantImageCell
        variant={getVariant(row, category.slug)}
        onUpload={(variantId, column, url) => onUpload(row, variantId, column, url)}
      />
    ),
  }))
}
