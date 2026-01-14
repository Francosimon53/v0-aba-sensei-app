export type Language = "English" | "Español" | "Português" | "Français"
export type ExamType = "RBT" | "BCBA"
export type Mode = "tutor" | "exam"

export interface Task {
  id: string
  task_id: string
  task_text: string
  domain: string
  exam_level: string
  keywords: string | null
}

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  preferred_language: string | null
  exam_level: string | null
  subscription_tier: string | null
  subscription_expires_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  exam_level_id: string
  category_id: string
  mode: string
  total_questions: number
  correct_answers: number
  duration_seconds: number
  status: string
  started_at: string
  completed_at: string | null
}

export interface UserProgress {
  id: string
  user_id: string
  category_id: string
  questions_attempted: number
  questions_correct: number
  current_streak: number
  best_streak: number
  mastery_level: string
  total_study_time_seconds: number
  last_practiced_at: string
}
