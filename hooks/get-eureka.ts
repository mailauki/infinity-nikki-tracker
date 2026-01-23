import { createClient } from "@/lib/supabase/client";
import { Eureka } from "@/lib/types/types";
import { Tables } from "@/lib/types/supabase";

type Obtained = Tables<'obtained'>

export async function getEurekaItems(obtained?: Obtained[]) {
	const supabase = await createClient()

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
	const { data: colors } = await supabase
	.from('colors')
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

		if (!obtained) return false
		return obtained.find((item) => item.eureka === eureka && item.color === color && item.category === category) ? true : false
	}

	const items = eureka?.map((item) => (
		Object.assign({
			...item,
			slug: item.name.split(" ").join("-").toLowerCase(),
			image_url: findImage({ eureka: item.name, isDefault: true }),
			colors: item.colors?.map((color) => Object.assign(
				{
					name: color.name,
					image_url: colors?.find((value) => color.name === value.name)?.image_url
				}
			)),
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

	return items
}

export async function getEurekaItem(slug: string, obtained?: Obtained[]) {
	const supabase = await createClient()

	// const name = slug
	// const name = slug.replace("-"," ")
	const name = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")

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
	.eq("name", name)
	.single()
		
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
	const { data: colors } = await supabase
	.from('colors')
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

		if (!obtained) return false
		return obtained.find((item) => item.eureka === eureka && item.color === color && item.category === category) ? true : false
	}

	const item = eureka && Object.assign({
			...eureka,
			slug: eureka.name.replace(" ", "-").toLowerCase(),
			image_url: findImage({ eureka: eureka.name, isDefault: true }),
			colors: eureka.colors?.map((color) => Object.assign(
				{
					name: color.name,
					image_url: colors?.find((value) => color.name === value.name)?.image_url
				}
			)),
			categories: categories?.map((category) => Object.assign(
				{
					name: category.name,
					image_url: category.image_url,
					colors: eureka.colors.map((color) => Object.assign(
						{
							name: color.name,
							slug: `${eureka.name.split(" ").join("_")}-${category.name}-${color.name}`,
							image_url: findImage({ eureka: eureka.name, color: color.name, category: category.name }),
							obtained: isObtained(`${eureka.name.split(" ").join("_")}-${category.name}-${color.name}`)
						}
					))
				}
			))
		}) as Eureka|null

		return item
	}