"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import type { Language, ExamType, Mode } from "@/types"

export default function Page() {
  const [step, setStep] = useState(1) // Start at step 1 (language selection) instead of 0
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("BCBA")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        setUserId(user.id)
      }
    }
    checkAuth()
  }, [])

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    // Save to localStorage for post-login
    localStorage.setItem("aba_sensei_language", lang)
    setStep(2)
  }

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type)
    // Save to localStorage
    localStorage.setItem("aba_sensei_exam_type", type)
    setStep(3)
  }

  const handleCategorySelect = (cat: string, selectedMode: Mode) => {
    // Navigate to tutor page with category context
    const params = new URLSearchParams({
      topic: cat,
      examType: examType,
      mode: selectedMode,
    })
    router.push(`/tutor?${params.toString()}`)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        {isAuthenticated ? (
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm bg-white/10 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>

      {step === 1 && <LanguageSelection onSelect={handleLanguageSelect} />}
      {step === 2 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
      {step === 3 && (
        <CategoryMenu examType={examType} onSelect={handleCategorySelect} onBack={handleBack} language={language} />
      )}
    </div>
  )
}
