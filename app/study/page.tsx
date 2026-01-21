"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import QuestionScreen from "@/components/question-screen"
import { Share2, Linkedin, X } from "lucide-react"
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
  // BCBA 6th Edition (2025) categories
  "A. Behaviorism and Philosophical Foundations": "A",
  "B. Concepts and Principles": "B",
  "C. Measurement, Data Display, and Interpretation": "C",
  "D. Experimental Design": "D",
  "E. Ethical and Professional Issues": "E",
  "F. Behavior Assessment": "F",
  "G. Behavior-Change Procedures": "G",
  "H. Selecting and Implementing Interventions": "H",
  "I. Personnel Supervision and Management": "I",
  // RBT 3rd Edition (2026) categories
  "A. Data Collection and Graphing": "A",
  "B. Behavior Assessment": "B",
  "C. Behavior Acquisition": "C",
  "D. Behavior Reduction": "D",
  "E. Documentation and Reporting": "E",
  "F. Ethics": "F",
}

export default function StudyPage() {
  const [step, setStep] = useState(0) // 0 = loading, 1 = exam type, 2 = category, 2.5 = difficulty, 3 = questions
  const [language] = useState<Language>("English") // Fixed to English only
  const [examType, setExamType] = useState<ExamType>("BCBA")
  const [mode, setMode] = useState<Mode>("tutor")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [taskAnswered, setTaskAnswered] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
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
      setStep(2.5) // Go to difficulty selection
    }
  }

  const handleBack = async () => {
    if (step === 3 && currentSession) {
      // Complete the session when leaving question screen
      const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000)
      await updateStudySession(currentSession.id, sessionStats.total, sessionStats.correct, duration, "completed")
      setCurrentSession(null)
    }
    // Handle step navigation properly
    if (step === 3) {
      setStep(2.5) // From questions back to difficulty
    } else if (step === 2.5) {
      setStep(2) // From difficulty back to category
    } else if (step > 1) {
      setStep(step - 1)
    } else {
      // Step 1 or less - go back to dashboard
      router.push("/dashboard")
    }
  }

  const handleQuestionAnswered = async (selectedOption: string, isCorrect: boolean, timeSpentSeconds: number) => {
    console.log("[v0] handleQuestionAnswered called:", { selectedOption, isCorrect, timeSpentSeconds, category })
    setTaskAnswered(true)
    if (currentTaskIndex < tasks.length) {
      setCurrentTask(tasks[currentTaskIndex])
    }

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
      setTaskAnswered(false)
      setCurrentTask(null)
    } else {
      setCurrentTaskIndex(0)
    }
  }

  const shareOnX = (text: string) => {
    // Remove any existing URLs from the text
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, "").trim()
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanText)}&url=${encodeURIComponent("https://abasensei.app")}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
  }

  const shareToTwitter = () => {
    const questionText = currentTask?.question?.substring(0, 100) || `${examType} exam question`
    const text = `🧠 ${questionText}...\n\nCan you answer? Test yourself on ABA Sensei\n\n#BCBA #RBT #ABA`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://abasensei.app")}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
    setShowShareModal(false)
  }

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://abasensei.app")}`
    window.open(linkedInUrl, "_blank", "width=550,height=420")
    setShowShareModal(false)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText("https://abasensei.app").then(() => {
      alert("Link copied to clipboard!")
      setShowShareModal(false)
    })
  }

  const handleShareTrapTip = () => {
    if (!currentTask) return
    // Extract trap info from task if available
    const text = `⚠️ EXAM TRAP: Check your answer on ABA Sensei\n\n💡 Watch for these common traps on your exam!\n\n#BCBA #RBT #ABA`
    shareOnX(text)
  }

  const handleShareAbaTerm = () => {
    if (!currentTask) return
    const text = `📚 ABA Terminology\n❌ Common: Often confused\n✅ ABA: Precise definitions matter!\n\n#BCBA #RBT`
    shareOnX(text)
  }

  const handleShareChallenge = () => {
    if (!currentTask) return
    const questionText = currentTask.question || "RBT/BCBA Question"
    const truncatedQuestion = questionText.substring(0, 120)
    const text = `🧠 ${examType} Question:\n\n${truncatedQuestion}...\n\nCan you answer? 👇\n\n#BCBA #RBT`
    shareOnX(text)
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
      {step === 2.5 && (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Select Difficulty</h2>
            <p className="text-white/60 mb-8">Choose how challenging you want these questions to be</p>

            <div className="grid grid-cols-1 gap-3">
              {/* Easy */}
              <button
                onClick={() => {
                  setDifficulty("Easy")
                  setStep(3)
                }}
                className="relative p-4 rounded-xl border-2 border-zinc-800 bg-zinc-900 hover:border-green-500 hover:bg-green-500/10 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🌱</div>
                  <div>
                    <div className="font-semibold text-white">Easy</div>
                    <div className="text-xs text-white/60">Basic definitions and fundamentals</div>
                  </div>
                </div>
              </button>

              {/* Medium */}
              <button
                onClick={() => {
                  setDifficulty("Medium")
                  setStep(3)
                }}
                className="relative p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <div className="font-semibold text-amber-400">Medium (Recommended)</div>
                    <div className="text-xs text-white/60">Application with clinical scenarios</div>
                  </div>
                </div>
              </button>

              {/* Hard */}
              <button
                onClick={() => {
                  setDifficulty("Hard")
                  setStep(3)
                }}
                className="relative p-4 rounded-xl border-2 border-zinc-800 bg-zinc-900 hover:border-red-500 hover:bg-red-500/10 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💀</div>
                  <div>
                    <div className="font-semibold text-white">Hard</div>
                    <div className="text-xs text-white/60">Complex exam-level questions</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 text-white/60 hover:text-white/80 text-sm flex items-center justify-center gap-2 mx-auto"
            >
              ← Back
            </button>
          </div>
        </div>
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

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" 
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl p-6 w-80 border border-white/10" 
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4 text-white">Share to</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-zinc-400">X</span>
              </button>
              
              <button 
                onClick={shareToLinkedIn}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center">
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-zinc-400">LinkedIn</span>
              </button>
              
              <button 
                onClick={copyShareLink}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-zinc-400">Copy Link</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 py-2 text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
