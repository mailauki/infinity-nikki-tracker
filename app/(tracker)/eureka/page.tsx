"use cache"

import RealtimeEureka from "@/components/realtime-eureka";
import { createClient } from "@/lib/supabase/client";
import { Eureka, Quantity } from "@/lib/types/types";

export default async function EurekaPage() {
	const supabase = await createClient();
	
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

	const { data: obtained } = await supabase
	.from("obtained")
	.select("*")
	.eq("user_id", user && user.id)
	
	const { data: eureka } = await supabase
	.from('eureka')
	.select(`
		id,
		name,
		quality,
		style,
		labels,
		trial,
		colors (
			name
		)
	`)
	const { data: images } = await supabase
	.from('images')
	.select(`
		id,
		image_url,
		eureka,
		color,
		category,
		default
	`)
	const { data: categories } = await supabase
	.from('categories')
	.select('name, image_url')
	
	function findImage({
		eureka, color, category, isDefault,
	}: {
		eureka: string,
		color?: string,
		category?: string,
		isDefault?: boolean,
	}) {
		const image = images?.filter((image) => image.eureka === eureka && image.color === color && image.category === category)![0]
		const defaultImage = images?.filter((image) => image.eureka === eureka && image.default === isDefault)![0]
		return isDefault ? defaultImage?.image_url : image?.image_url
	}
	
	function isObtained(slug: string) {
		const splitSlug = slug.split("-")
		const eureka = splitSlug[0].split("_").join(" ")
		const category = splitSlug[1]
		const color = splitSlug[2]

		return obtained?.find((item) => item.eureka === eureka && item.color === color && item.category === category) ? true : false
	}
	
	const items = eureka?.map((item) => (
		Object.assign({
			...item,
			image_url: findImage({ eureka: item.name, isDefault: true }),
			categories: categories?.map((category) => Object.assign(
				{
					name: category.name,
					image_url: category.image_url,
					colors: item.colors.map((color) => Object.assign(
						{
							name: color.name,
							slug: `${item.name.split(" ").join("_")}-${category.name}-${color.name}`,
							image_url: findImage({ eureka: item.name, color: color.name, category: category.name }),
							obtained: isObtained(`${item.name.split(" ").join("_")}-${category.name}-${color.name}`)
						}
					))
				}
			))
		}))
	) as Eureka[]

	const obtainedCount = items.map((item) => Object.assign({
		name: item.name,
		trial: item.trial,
		obtained: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().filter((value) => value === true).length,
		total: item.categories.map((category) => category.colors.map((color) => color.obtained).flat()).flat().length,
		colors: item.colors.map((itemColor) => Object.assign({
			name: itemColor.name,
			obtained: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().filter((value) => value.obtained === true).length,
			total: item.categories.map((category) => category.colors.filter((color) => color.name === itemColor.name)).flat().length
		})),
		categories: item.categories.map((category) => Object.assign({
			name: category.name,
			obtained: category.colors.map((color) => color.obtained === true).flat().filter((value) => value === true).length,
			total: category.colors.length,
		}))
	})) as Quantity[]

	return (
		<>
			<RealtimeEureka
				serverItems={items}
				serverObtained={obtained||[]}
				serverObtainedCount={obtainedCount}
			/>
		</>
	)
}