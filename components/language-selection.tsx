"use client"

import { Button } from "@/components/ui/button"
import type { Language } from "@/types"

interface LanguageSelectionProps {
  onSelect: (language: Language) => void
}

export function LanguageSelection({ onSelect }: LanguageSelectionProps) {
  const languages: Language[] = ["English", "Español", "Português", "Français"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-6">
            <div className="text-9xl animate-pulse">🥋</div>
            <div className="text-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-2">
                ABA Sensei
              </h1>
              <p className="text-slate-400 text-lg font-light tracking-wide">AI-Powered Exam Preparation</p>
            </div>
          </div>

          <div className="w-full space-y-4">
            {languages.map((lang) => (
              <Button
                key={lang}
                onClick={() => onSelect(lang)}
                className="w-full h-16 text-lg font-semibold bg-slate-800/50 hover:bg-gradient-to-r hover:from-amber-500 hover:to-yellow-600 hover:text-black text-white border border-slate-700 hover:border-amber-500 transition-all duration-300 hover:scale-105"
                variant="outline"
              >
                {lang}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
