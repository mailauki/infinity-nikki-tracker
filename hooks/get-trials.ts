import { createClient } from "@/lib/supabase/server";

export async function getTrials() {
	const supabase = await createClient()
	const { data: trials } = await supabase
	.from("trials")
	.select("name, image_url")
	.order('id', { ascending: true })

	return trials
}