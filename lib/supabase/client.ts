import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase client: Missing environment variables", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  console.log("[v0] Supabase client: Creating client with URL:", supabaseUrl.substring(0, 30) + "...")

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
