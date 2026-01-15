"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import type { Language, ExamType } from "@/types"

export default function Page() {
  const [step, setStep] = useState(1) // Start at step 1 (language selection) instead of 0
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("BCBA")
  const router = useRouter()

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
    router.push("/sensei")
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen gradient-bg">
      {step === 1 && <LanguageSelection onSelect={handleLanguageSelect} />}
      {step === 2 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
    </div>
  )
}
