"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, BookOpen, Award } from "lucide-react"
import type { ExamType, Language } from "@/app/page"

interface ExamTypeSelectionProps {
  onSelect: (type: ExamType) => void
  onBack: () => void
  language: Language
}

const translations = {
  English: {
    title: "Choose Exam Type",
    subtitle: "Select your certification level",
    rbt: "Registered Behavior Technician",
    bcba: "Board Certified Behavior Analyst",
  },
  Español: {
    title: "Elige el tipo de examen",
    subtitle: "Selecciona tu nivel de certificación",
    rbt: "Técnico de Comportamiento Registrado",
    bcba: "Analista de Comportamiento Certificado",
  },
  Português: {
    title: "Escolha o tipo de exame",
    subtitle: "Selecione seu nível de certificação",
    rbt: "Técnico de Comportamento Registrado",
    bcba: "Analista de Comportamento Certificado",
  },
  Français: {
    title: "Choisissez le type d'examen",
    subtitle: "Sélectionnez votre niveau de certification",
    rbt: "Technicien en Comportement Enregistré",
    bcba: "Analyste du Comportement Certifié",
  },
}

export function ExamTypeSelection({ onSelect, onBack, language }: ExamTypeSelectionProps) {
  const t = translations[language]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          <div className="w-full space-y-4">
            <Button
              onClick={() => onSelect("RBT")}
              className="w-full h-24 flex flex-col gap-2 bg-secondary hover:bg-accent hover:text-accent-foreground transition-all"
              variant="secondary"
            >
              <BookOpen className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">RBT</span>
                <span className="text-sm opacity-80">{t.rbt}</span>
              </div>
            </Button>

            <Button
              onClick={() => onSelect("BCBA")}
              className="w-full h-24 flex flex-col gap-2 bg-secondary hover:bg-accent hover:text-accent-foreground transition-all"
              variant="secondary"
            >
              <Award className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">BCBA</span>
                <span className="text-sm opacity-80">{t.bcba}</span>
              </div>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
