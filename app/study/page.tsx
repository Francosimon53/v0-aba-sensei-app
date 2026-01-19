"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import QuestionScreen from "@/components/question-screen"
import type { Language, ExamType, Mode, Task, StudySession } from "@/types"
import {
  createStudySession,
  updateStudySession,
  recordQuestionAttempt,
  updateUserProgress,
  getUserProfile,
  updateUserProfile,
  getUserLastProgress,
} from "@/lib/supabase/progress"

export const categoryToDomain: Record<string, string> = {
  // BCBA categories - match exact names from CategoryMenu
  "A. Behaviorism and Philosophical Foundations": "A",
  "B. Concepts and Principles": "B",
  "C. Measurement, Data Display, and Interpretation": "C",
  "D. Experimental Design": "D",
  "E. Ethical and Professional Issues": "E",
  "F. Behavior Assessment": "F",
  "G. Behavior-Change Procedures": "G",
  "H. Selecting and Implementing Interventions": "H",
  "I. Personnel Supervision and Management": "I",
  // RBT categories
  Measurement: "A",
  Assessment: "B",
  "Skill Acquisition": "C",
  "Behavior Reduction": "D",
  Documentation: "E",
  "Professional Scope": "F",
}

export default function StudyPage() {
  const [step, setStep] = useState(0) // 0 = loading, 1 = exam type, 2 = category, 3 = questions
  const [language] = useState<Language>("English") // Fixed to English only
  const [examType, setExamType] = useState<ExamType>("BCBA")
  const [mode, setMode] = useState<Mode>("tutor")
  const [category, setCategory] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, startTime: Date.now() })
  const router = useRouter()

  // Check auth and load user preferences on mount
  useEffect(() => {
    async function checkAuthAndLoadPreferences() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Load user profile and preferences
      const profile = await getUserProfile(user.id)

      if (profile?.onboarding_completed && profile?.exam_level) {
        // User has completed onboarding, skip to category selection
        setExamType(profile.exam_level.toUpperCase() as ExamType)
        setStep(2) // Go to category selection
      } else {
        // New user, start with exam type selection
        setStep(1)
      }
    }

    checkAuthAndLoadPreferences()
  }, [router])

  const handleExamTypeSelect = async (type: ExamType) => {
    setExamType(type)
    if (userId) {
      await updateUserProfile(userId, {
        exam_level: type.toLowerCase(),
        preferred_language: "en", // Always English
        onboarding_completed: true,
      })
    }
    setStep(2) // Go to category selection
  }

  const handleCategorySelect = async (cat: string, selectedMode: Mode) => {
    setCategory(cat)
    setMode(selectedMode)
    setCurrentTaskIndex(0)
    setLoadingTasks(true)
    setSessionStats({ total: 0, correct: 0, startTime: Date.now() })

    const domain = categoryToDomain[cat] || cat.charAt(0)
    console.log("[v0] Category selected:", { cat, domain, mapping: categoryToDomain })

    // Create study session
    if (userId) {
      const session = await createStudySession(userId, examType, domain, selectedMode)
      setCurrentSession(session)
    }

    try {
      const domain = categoryToDomain[cat] || cat.charAt(0)
      const response = await fetch(`/api/tasks?examLevel=${examType.toLowerCase()}&domain=${domain}`)

      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        console.error("[v0] Failed to fetch tasks")
        setTasks([])
      }
    } catch (error) {
      console.error("[v0] Error fetching tasks:", error)
      setTasks([])
    } finally {
      setLoadingTasks(false)
      setStep(3) // Go to question screen
    }
  }

  const handleBack = async () => {
    if (step === 3 && currentSession) {
      // Complete the session when leaving question screen
      const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000)
      await updateStudySession(currentSession.id, sessionStats.total, sessionStats.correct, duration, "completed")
      setCurrentSession(null)
    }
    if (step > 1) setStep(step - 1)
  }

  const handleQuestionAnswered = async (selectedOption: string, isCorrect: boolean, timeSpentSeconds: number) => {
    console.log("[v0] handleQuestionAnswered called:", { selectedOption, isCorrect, timeSpentSeconds, category })

    // Update local stats
    setSessionStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }))

    if (userId) {
      console.log("[v0] User ID exists:", userId)

      const categoryId = categoryToDomain[category] || category.charAt(0)
      console.log("[v0] Category mapping:", {
        rawCategory: category,
        mappedCategoryId: categoryId,
        allMappings: categoryToDomain,
      })

      // Validate category_id is not empty
      if (!categoryId || categoryId.trim() === "") {
        console.error("[v0] ERROR: category_id is empty!", { category, categoryId })
        return
      }

      // Record the attempt
      const attemptResult = await recordQuestionAttempt(
        userId,
        currentSession?.id || null,
        null, // No specific question ID for AI-generated questions
        selectedOption,
        isCorrect,
        timeSpentSeconds,
        mode,
      )
      console.log("[v0] Record attempt result:", attemptResult)

      // Update user progress with validated category_id
      console.log("[v0] About to call updateUserProgress with:", { userId, categoryId, isCorrect, timeSpentSeconds })
      const progressResult = await updateUserProgress(userId, categoryId, isCorrect, timeSpentSeconds)
      console.log("[v0] Update progress result:", progressResult)

      // Update session stats
      if (currentSession) {
        const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000)
        const sessionResult = await updateStudySession(
          currentSession.id,
          sessionStats.total + 1,
          sessionStats.correct + (isCorrect ? 1 : 0),
          duration,
        )
        console.log("[v0] Update session result:", sessionResult)
      }
    } else {
      console.error("[v0] No user ID found - cannot save progress")
    }
  }

  const advanceTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1)
    } else {
      setCurrentTaskIndex(0)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  // Loading state
  if (step === 0) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🥋</div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header with navigation */}
      {userId && (
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white/60 hover:text-white/80 text-sm flex items-center gap-2"
            >
              ← Dashboard
            </button>
            <button onClick={handleLogout} className="text-white/40 hover:text-white/60 text-sm">
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Logout button */}
      {/* <button onClick={handleLogout} className="absolute top-4 right-4 text-white/40 hover:text-white/60 text-sm z-50">
        Logout
      </button> */}

      {step === 1 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
      {step === 2 && (
        <CategoryMenu examType={examType} onSelect={handleCategorySelect} onBack={handleBack} language={language} />
      )}
      {step === 3 && (
        <QuestionScreen
          examType={examType}
          category={category}
          mode={mode}
          onBack={handleBack}
          language={language}
          tasks={tasks}
          currentTaskIndex={currentTaskIndex}
          onTaskComplete={advanceTask}
          loadingTasks={loadingTasks}
          onQuestionAnswered={handleQuestionAnswered}
        />
      )}
    </div>
  )
}
