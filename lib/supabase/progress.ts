import { createClient } from "@/lib/supabase/client"
import type { StudySession } from "@/types"

// Create a new study session when user starts studying
export async function createStudySession(
  userId: string,
  examLevel: string,
  categoryId: string,
  mode: string,
): Promise<StudySession | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: userId,
      exam_level_id: examLevel.toLowerCase(),
      category_id: categoryId,
      mode: mode,
      total_questions: 0,
      correct_answers: 0,
      duration_seconds: 0,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating study session:", error)
    return null
  }

  return data
}

// Update study session with question results
export async function updateStudySession(
  sessionId: string,
  totalQuestions: number,
  correctAnswers: number,
  durationSeconds: number,
  status: "in_progress" | "completed" = "in_progress",
): Promise<boolean> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    duration_seconds: durationSeconds,
    status: status,
  }

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase.from("study_sessions").update(updateData).eq("id", sessionId)

  if (error) {
    console.error("[v0] Error updating study session:", error)
    return false
  }

  return true
}

// Record a question attempt
export async function recordQuestionAttempt(
  userId: string,
  sessionId: string | null,
  questionId: string | null,
  selectedOption: string,
  isCorrect: boolean,
  timeSpentSeconds: number,
  mode: string,
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("question_attempts").insert({
    user_id: userId,
    session_id: sessionId,
    question_id: questionId,
    selected_option: selectedOption,
    is_correct: isCorrect,
    time_spent_seconds: timeSpentSeconds,
    mode: mode,
  })

  if (error) {
    console.error("[v0] Error recording question attempt:", error)
    return false
  }

  return true
}

// Update user progress for a category
export async function updateUserProgress(
  userId: string,
  categoryId: string,
  isCorrect: boolean,
  timeSpentSeconds: number,
): Promise<boolean> {
  const supabase = createClient()

  console.log("[v0] updateUserProgress called with:", { userId, categoryId, isCorrect, timeSpentSeconds })

  if (!categoryId || categoryId.trim() === "") {
    console.error("[v0] ERROR: categoryId is empty or null!")
    return false
  }

  // First, try to get existing progress
  const { data: existingProgress, error: fetchError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .single()

  console.log("[v0] Existing progress query result:", { existingProgress, fetchError })

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("[v0] Error fetching user progress:", fetchError)
    return false
  }

  if (existingProgress) {
    // Update existing progress
    const newStreak = isCorrect ? existingProgress.current_streak + 1 : 0
    const newBestStreak = Math.max(newStreak, existingProgress.best_streak)

    const updateData = {
      questions_attempted: existingProgress.questions_attempted + 1,
      questions_correct: existingProgress.questions_correct + (isCorrect ? 1 : 0),
      current_streak: newStreak,
      best_streak: newBestStreak,
      total_study_time_seconds: existingProgress.total_study_time_seconds + timeSpentSeconds,
      last_practiced_at: new Date().toISOString(),
      mastery_level: calculateMasteryLevel(
        existingProgress.questions_correct + (isCorrect ? 1 : 0),
        existingProgress.questions_attempted + 1,
      ),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Updating existing progress with data:", updateData)

    const { data: updatedData, error: updateError } = await supabase
      .from("user_progress")
      .update(updateData)
      .eq("id", existingProgress.id)
      .select()

    console.log("[v0] Update result:", { updatedData, updateError })

    if (updateError) {
      console.error("[v0] Error updating user progress:", updateError)
      return false
    }

    console.log("[v0] Successfully updated user progress")
    return true
  } else {
    const insertData = {
      user_id: userId,
      category_id: categoryId, // Explicitly set category_id
      questions_attempted: 1,
      questions_correct: isCorrect ? 1 : 0,
      current_streak: isCorrect ? 1 : 0,
      best_streak: isCorrect ? 1 : 0,
      total_study_time_seconds: timeSpentSeconds,
      mastery_level: "novice",
      last_practiced_at: new Date().toISOString(),
    }

    console.log("[v0] Creating new progress record with data:", insertData)

    const { data: insertedData, error: insertError } = await supabase.from("user_progress").insert(insertData).select()

    console.log("[v0] Insert result:", { insertedData, insertError })

    if (insertError) {
      console.error("[v0] Error inserting user progress:", insertError)
      return false
    }

    console.log("[v0] Successfully created new user progress record")
  }

  const { data: verifyData, error: verifyError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .single()

  console.log("[v0] Verification after save:", { verifyData, verifyError })

  if (verifyError) {
    console.error("[v0] ERROR: Could not verify saved data!", verifyError)
    return false
  }

  if (!verifyData || verifyData.category_id !== categoryId) {
    console.error("[v0] ERROR: category_id mismatch after save!", {
      expected: categoryId,
      actual: verifyData?.category_id,
    })
    return false
  }

  return true
}

// Get user's last progress to resume from
export async function getUserLastProgress(userId: string): Promise<{
  categoryId: string
  taskIndex: number
  examLevel: string
} | null> {
  const supabase = createClient()

  // Get the most recently practiced category
  const { data: progress, error } = await supabase
    .from("user_progress")
    .select("category_id, last_practiced_at")
    .eq("user_id", userId)
    .order("last_practiced_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !progress) {
    return null
  }

  // Get user's profile for exam level
  const { data: profile } = await supabase.from("profiles").select("exam_level").eq("id", userId).single()

  return {
    categoryId: progress.category_id,
    taskIndex: 0, // Start from beginning of category
    examLevel: profile?.exam_level || "bcba",
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }

  return data
}

// Update user profile with preferences
export async function updateUserProfile(
  userId: string,
  preferences: {
    preferred_language?: string
    exam_level?: string
    onboarding_completed?: boolean
  },
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("[v0] Error updating user profile:", error)
    return false
  }

  return true
}

// Helper function to calculate mastery level
function calculateMasteryLevel(correct: number, attempted: number): string {
  if (attempted < 5) return "novice"
  const accuracy = correct / attempted
  if (accuracy >= 0.9 && attempted >= 20) return "master"
  if (accuracy >= 0.8 && attempted >= 15) return "advanced"
  if (accuracy >= 0.7 && attempted >= 10) return "intermediate"
  return "novice"
}
