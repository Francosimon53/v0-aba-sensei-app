"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import type { Language } from "@/types"

interface LanguageSelectionProps {
  onSelect: (language: Language) => void
}

export function LanguageSelection({ onSelect }: LanguageSelectionProps) {
  const languages: Language[] = ["English", "Español", "Português", "Français"]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/20">
              <GraduationCap className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-accent">ABA Sensei</h1>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Welcome</h2>
            <p className="text-muted-foreground">Select your language to begin</p>
          </div>

          <div className="w-full space-y-3">
            {languages.map((lang) => (
              <Button
                key={lang}
                onClick={() => onSelect(lang)}
                className="w-full h-14 text-lg font-medium bg-secondary hover:bg-accent hover:text-accent-foreground transition-all"
                variant="secondary"
              >
                {lang}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
