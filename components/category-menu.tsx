"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ChevronLeft,
  Brain,
  Users,
  LineChart,
  FileText,
  ClipboardList,
  Shield,
  Cog,
  FlaskConical,
  Scale,
  Target,
} from "lucide-react"
import { useState } from "react"
import type { ExamType, Mode, Language } from "@/types"

interface CategoryMenuProps {
  examType: ExamType
  onSelect: (category: string, mode: Mode) => void
  onBack: () => void
  language: Language
}

const translations = {
  English: {
    title: "Select Category",
    tutor: "Tutor Mode",
    exam: "Exam Mode",
  },
  Español: {
    title: "Seleccionar categoría",
    tutor: "Modo Tutorial",
    exam: "Modo Examen",
  },
  Português: {
    title: "Selecione a categoria",
    tutor: "Modo Tutorial",
    exam: "Modo Exame",
  },
  Français: {
    title: "Sélectionner la catégorie",
    tutor: "Mode Tuteur",
    exam: "Mode Examen",
  },
}

const rbtCategories = [
  { name: "Measurement", icon: LineChart },
  { name: "Assessment", icon: Brain },
  { name: "Skill Acquisition", icon: Target },
  { name: "Behavior Reduction", icon: ClipboardList },
  { name: "Documentation", icon: FileText },
  { name: "Professional Scope", icon: Shield },
]

const bcbaCategories = [
  { name: "A. Behaviorism and Philosophical Foundations", icon: Brain },
  { name: "B. Concepts and Principles", icon: Brain },
  { name: "C. Measurement, Data Display, and Interpretation", icon: LineChart },
  { name: "D. Experimental Design", icon: FlaskConical },
  { name: "E. Ethical and Professional Issues", icon: Scale },
  { name: "F. Behavior Assessment", icon: ClipboardList },
  { name: "G. Behavior-Change Procedures", icon: Cog },
  { name: "H. Selecting and Implementing Interventions", icon: Target },
  { name: "I. Personnel Supervision and Management", icon: Users },
]

export function CategoryMenu({ examType, onSelect, onBack, language }: CategoryMenuProps) {
  const [mode, setMode] = useState<Mode>("tutor")
  const t = translations[language]

  const categories = examType === "RBT" ? rbtCategories : bcbaCategories

  const handleCategoryClick = (categoryName: string) => {
    if (mode === "tutor") {
      // Navigate to chat with topic parameter
      const router = typeof window !== "undefined" ? window.location : null
      if (router) {
        window.location.href = `/tutor?topic=${encodeURIComponent(categoryName)}&examType=${examType}`
      }
    } else {
      // Continue with existing exam mode flow
      onSelect(categoryName, mode)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-4 sm:p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
            <p className="text-sm text-accent font-semibold">{examType} Exam</p>
          </div>

          <div className="flex gap-2 p-1 bg-secondary rounded-lg">
            <button
              onClick={() => setMode("tutor")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === "tutor" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.tutor}
            </button>
            <button
              onClick={() => setMode("exam")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === "exam" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.exam}
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className="w-full h-auto py-3 px-3 sm:px-4 justify-start gap-3 bg-secondary hover:bg-accent hover:text-accent-foreground transition-all whitespace-normal text-left"
                  variant="secondary"
                >
                  <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base leading-snug flex-1 py-1">{category.name}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
