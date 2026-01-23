import { createClient } from "@/lib/supabase/client";

export async function handleObtained(slug: string) {
	const splitSlug = slug.split("-")
	const eureka = splitSlug[0].split("_").join(" ")
	const category = splitSlug[1]
	const color = splitSlug[2]

	const supabase = await createClient();
	
	const { data: { user } } = await supabase.auth.getUser()

	const { data: obtained } = await supabase
	.from("obtained")
	.select("*")
	.eq("user_id", user!.id)

	const addObtained = Object.assign({
		eureka,
		category,
		color,
		user_id: user!.id,
	})

	const isObtained = obtained?.find((item) => item.eureka === eureka && item.color === color && item.category === category)
	
	if (isObtained) {
		const { error } = await supabase
		.from('obtained')
		.delete()
		.eq("user_id", user!.id)
		.eq('id', isObtained!.id)
		if (error) console.log(error)
	} else {
		const { data, error } = await supabase
		.from('obtained')
		.insert([
			addObtained,
		])
		.select("*")
		if (error) console.log(error)
		return data
	}
}