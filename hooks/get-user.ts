

import { createClient } from "@/lib/supabase/server";

export async function getUser() {
	"use server"

	const supabase = await createClient();

	const { data: { user }, error } = await supabase.auth.getUser()

	// const { data: obtained } = await supabase
	// .from("obtained")
	// .select("*")
	// .eq("user_id", user!.id)
	// const obtained: Obtained[]|null = null
	if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }

  if (user) {
    console.log('User ID:', user.id);
    return user.id;
  } else {
    console.log('No user is currently signed in.');
    return null;
  }
}