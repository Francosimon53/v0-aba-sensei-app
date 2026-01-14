"use client"

import { useState } from "react"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import QuestionScreen from "@/components/question-screen"

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
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("RBT")
  const [mode, setMode] = useState<Mode>("tutor")
  const [category, setCategory] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [loadingTasks, setLoadingTasks] = useState(false)

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
      // Loop back to beginning when all tasks completed
      setCurrentTaskIndex(0)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
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
          onNextTask={advanceTask}
          loadingTasks={loadingTasks}
        />
      )}
    </div>
  )
}
