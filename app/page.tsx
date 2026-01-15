"use client"

import { useState } from "react"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import QuestionScreen from "@/components/question-screen"
import type { Language, ExamType, Mode, Task } from "@/types"

export default function Page() {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("BCBA")
  const [mode, setMode] = useState<Mode>("tutor")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setStep(2)
  }

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type)
    setStep(3)
  }

  const handleCategorySelect = (category: string, selectedMode: Mode) => {
    setSelectedCategory(category)
    setMode(selectedMode)
    setStep(4)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const advanceTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {step === 1 && <LanguageSelection onSelect={handleLanguageSelect} />}
      {step === 2 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
      {step === 3 && (
        <CategoryMenu
          examType={examType}
          onSelectCategory={handleCategorySelect}
          onBack={handleBack}
          language={language}
        />
      )}
      {step === 4 && (
        <QuestionScreen
          category={selectedCategory}
          mode={mode}
          language={language}
          examType={examType}
          onTaskComplete={advanceTask}
          tasks={tasks}
          currentTaskIndex={currentTaskIndex}
          loadingTasks={false}
        />
      )}
    </div>
  )
}
