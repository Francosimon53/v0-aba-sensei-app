"use client"

import { useState } from "react"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import { QuestionScreen } from "@/components/question-screen"

export type Language = "English" | "Español" | "Português" | "Français"
export type ExamType = "RBT" | "BCBA"
export type Mode = "tutor" | "exam"

export default function Page() {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("RBT")
  const [mode, setMode] = useState<Mode>("tutor")
  const [category, setCategory] = useState("")

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setStep(2)
  }

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type)
    setStep(3)
  }

  const handleCategorySelect = (cat: string, selectedMode: Mode) => {
    setCategory(cat)
    setMode(selectedMode)
    setStep(4)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen gradient-bg">
      {step === 1 && <LanguageSelection onSelect={handleLanguageSelect} />}
      {step === 2 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
      {step === 3 && (
        <CategoryMenu examType={examType} onSelect={handleCategorySelect} onBack={handleBack} language={language} />
      )}
      {step === 4 && (
        <QuestionScreen examType={examType} category={category} mode={mode} onBack={handleBack} language={language} />
      )}
    </div>
  )
}
