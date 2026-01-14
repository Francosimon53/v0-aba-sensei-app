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
  user_id?: string
  category_id: string // Changed from "category" to "category_id"
  questions_attempted?: number
  questions_correct?: number
  current_streak?: number
  best_streak?: number
  mastery_level?: string
  total_study_time_seconds?: number
  last_practiced_at?: string
}

export async function saveProgress(progress: {
  category_id: string // Changed from "category" to "category_id"
  user_answer: number
  correct_answer: number
  is_correct: boolean
  exam_type: string
}) {
  if (!supabase) {
    console.warn("[v0] Supabase is not configured. Progress will not be saved.")
    return null
  }

  try {
    const { data, error } = await supabase
      .from("user_progress")
      .insert([
        {
          category_id: progress.category_id, // Changed from "category"
          last_practiced_at: new Date().toISOString(),
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
