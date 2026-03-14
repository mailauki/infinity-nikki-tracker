import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { Category, Color, EurekaSet, EurekaVariant, ObtainedEureka } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data: eurekaSets, error: eurekaSetsError } = await supabase
    .from('eureka_sets')
    .select(
      `
      id,
      slug,
      title,
      rarity,
      style,
      label,
      trial,
      updated_at,
      eureka_variants (
        id,
        slug,
        eureka_set,
        color,
        category,
        image_url,
        default
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'eureka_variants', ascending: true })

  if (eurekaSetsError) {
    console.error('Failed to fetch eureka sets:', eurekaSetsError)
    return NextResponse.json({ error: eurekaSetsError.message }, { status: 500 })
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  if (categoriesError) {
    console.error('Failed to fetch categories:', categoriesError)
    return NextResponse.json({ error: categoriesError.message }, { status: 500 })
  }

  const { data: colors, error: colorsError } = await supabase
    .from('colors')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  if (colorsError) {
    console.error('Failed to fetch colors:', colorsError)
    return NextResponse.json({ error: colorsError.message }, { status: 500 })
  }

  const typedCategories = (categories ?? []) as Category[]
  const typedColors = (colors ?? []) as Color[]

  const eureka = (eurekaSets ?? []).map((eurekaSet) => ({
    ...eurekaSet,
    image_url: eurekaSet.eureka_variants.find((variant) => variant.default)?.image_url,
    categories: typedCategories,
    colors: [...new Set(eurekaSet.eureka_variants.map((variant) => variant.color))].flatMap(
      (colorSlug) => typedColors.filter((color) => color.slug === colorSlug)
    ),
  })) as EurekaSet[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in eureka route:', authError)
    return NextResponse.json({ error: authError.message }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json(eureka)
  }

  const { data: obtained, error: obtainedError } = await supabase
    .from('obtained_eureka')
    .select('id, eureka_set, category, color')
    .eq('user_id', user.id)

  if (obtainedError) {
    console.error('Failed to fetch obtained eureka:', obtainedError)
    return NextResponse.json({ error: obtainedError.message }, { status: 500 })
  }

  const obtainedEureka = (obtained ?? []) as ObtainedEureka[]

  const eurekaWithObtained = eureka.map((eurekaSet) => ({
    ...eurekaSet,
    eureka_variants: eurekaSet.eureka_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedEureka.find(
        (record) =>
          variant.eureka_set === record.eureka_set &&
          variant.category === record.category &&
          variant.color === record.color
      ),
    })) as EurekaVariant[],
  })) as EurekaSet[]

  return NextResponse.json(eurekaWithObtained)
}
