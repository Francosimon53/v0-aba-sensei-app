"use client"

import { Button } from "@/components/ui/button"
import type { Language } from "@/types"

interface LanguageSelectionProps {
  onSelect: (language: Language) => void
}

export function LanguageSelection({ onSelect }: LanguageSelectionProps) {
  const languages: Language[] = ["English", "Español", "Português", "Français"]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4">
            <div className="text-8xl">🥋</div>
            <h1 className="text-4xl font-bold text-white">ABA Sensei</h1>
          </div>

          <div className="w-full space-y-3">
            {languages.map((lang) => (
              <Button
                key={lang}
                onClick={() => onSelect(lang)}
                className="w-full h-16 text-lg font-medium bg-white/10 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-all"
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
