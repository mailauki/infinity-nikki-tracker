import { createClient } from "@/lib/supabase/server";
import { UserMetadata } from "@supabase/supabase-js";

export async function getObtained(user: UserMetadata) {
	const supabase = await createClient()

	if (!user) return null
	
	const user_id = user.sub

	const { data: obtained } = await supabase
	.from("obtained")
	.select("*")
	.eq("user_id", user_id)

	return obtained
}