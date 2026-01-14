import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Check if Supabase is configured
const isSupabaseConfigured =
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http") && !supabaseUrl.includes("your_supabase")

// Only create client if properly configured
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export interface UserProgress {
  id?: string
  category: string
  user_answer: number
  correct_answer: number
  is_correct: boolean
  exam_type: string
  created_at?: string
}

export async function saveProgress(progress: Omit<UserProgress, "id" | "created_at">) {
  if (!supabase) {
    console.warn("[v0] Supabase is not configured. Progress will not be saved.")
    return null
  }

  try {
    const { data, error } = await supabase
      .from("user_progress")
      .insert([
        {
          category: progress.category,
          user_answer: progress.user_answer,
          correct_answer: progress.correct_answer,
          is_correct: progress.is_correct,
          exam_type: progress.exam_type,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error saving progress:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("[v0] Failed to save progress:", error)
    throw error
  }
}
