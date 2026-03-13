import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { Category, Color, EurekaSet, EurekaVariant, ObtainedEureka } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data: eurekaSets } = await supabase
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

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  const { data: colors } = await supabase
    .from('colors')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  const typedCategories = (categories ?? []) as Category[]
  const typedColors = (colors ?? []) as Color[]

  const eureka = eurekaSets?.map((eurekaSet) => ({
    ...eurekaSet,
    image_url: eurekaSet.eureka_variants.find((item) => item.default)?.image_url,
    categories: typedCategories,
    colors: [...new Set(eurekaSet.eureka_variants.map((item) => item.color))].flatMap((item) =>
      typedColors.filter((color) => color.slug === item)
    ),
  })) as EurekaSet[]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(eureka ?? [])
  }

  const { data: obtained } = await supabase
    .from('obtained_eureka')
    .select('id, eureka_set, category, color')
    .eq('user_id', user.id)

  const obtainedEureka = (obtained ?? []) as ObtainedEureka[]

  const eurekaWithObtained = eureka?.map((eurekaSet) => ({
    ...eurekaSet,
    eureka_variants: eurekaSet.eureka_variants.map((item) => ({
      ...item,
      obtained: !!obtainedEureka.find(
        (value) =>
          item.eureka_set === value.eureka_set &&
          item.category === value.category &&
          item.color === value.color
      ),
    })) as EurekaVariant[],
  })) as EurekaSet[]

  return NextResponse.json(eurekaWithObtained ?? [])
}
