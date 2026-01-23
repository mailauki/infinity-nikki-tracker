import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// export async function getUser() {
// 	"use server"

// 	const supabase = await createClient();

// 	const { data: { user }, error } = await supabase.auth.getUser()

// 	// const { data: obtained } = await supabase
// 	// .from("obtained")
// 	// .select("*")
// 	// .eq("user_id", user!.id)
// 	// const obtained: Obtained[]|null = null
// 	if (error) {
//     console.error('Error fetching user:', error.message);
//     return null;
//   }

//   if (user) {
//     console.log('User ID:', user.id);
//     return user.id;
//   } else {
//     console.log('No user is currently signed in.');
//     return null;
//   }
// }

export const getUser = async () => {
  const supabase = await createClient()
	const { data } = await supabase.auth.getClaims()
	
  return data?.claims.user_metadata
}

export const getCachedUser = cache(async () => {
  const supabase = await createClient()

  // const { data: { user } } = await supabase.auth.getUser()
	const { data } = await supabase.auth.getClaims()
	
  return data?.claims.user_metadata
})