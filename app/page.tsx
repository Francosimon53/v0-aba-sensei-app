"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import QuestionScreen from "@/components/question-screen"
import type { Language, ExamType, Mode, Task } from "@/types"

export const categoryToDomain: Record<string, string> = {
  // BCBA categories
  "B. Concepts & Principles": "B",
  "C. Measurement & Data Display": "C",
  "D. Experimental Design": "D",
  "E. Ethics Code": "E",
  "F. Behavior Assessment": "F",
  "G. Behavior-Change Procedures": "G",
  "H. Selecting Interventions": "H",
  "I. Personnel Supervision": "I",
  // RBT categories
  Measurement: "A",
  Assessment: "B",
  "Skill Acquisition": "C",
  "Behavior Reduction": "D",
  Documentation: "E",
  "Professional Scope": "F",
}

export default function Page() {
  const [step, setStep] = useState(0) // 0 = loading/checking auth
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("RBT")
  const [mode, setMode] = useState<Mode>("tutor")
  const [category, setCategory] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // User is logged in, redirect to study page
        router.push("/study")
      } else {
        // Show landing/guest mode
        setIsAuthenticated(false)
        setStep(1)
      }
    }
    checkAuth()
  }, [router])

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setStep(2)
  }

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type)
    setStep(3)
  }

  const handleCategorySelect = async (cat: string, selectedMode: Mode) => {
    setCategory(cat)
    setMode(selectedMode)
    setCurrentTaskIndex(0)
    setLoadingTasks(true)

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
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const advanceTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1)
    } else {
      setCurrentTaskIndex(0)
    }
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
      {/* Login/Signup prompt for guest users */}
      {!isAuthenticated && step === 1 && (
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/auth/sign-up")}
            className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-medium rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-colors"
          >
            Sign Up
          </button>
        </div>
      )}

      {step === 1 && <LanguageSelection onSelect={handleLanguageSelect} />}
      {step === 2 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
      {step === 3 && (
        <CategoryMenu examType={examType} onSelect={handleCategorySelect} onBack={handleBack} language={language} />
      )}
      {step === 4 && (
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
        />
      )}
    </div>
  )
}
