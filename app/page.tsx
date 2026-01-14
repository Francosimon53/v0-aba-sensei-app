"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LanguageSelection } from "@/components/language-selection"
import type { Language } from "@/types"

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
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // User is logged in, redirect to study page
        router.push("/study")
      } else {
        // Show language selection for guests
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLanguageSelect = (lang: Language) => {
    // Save language to localStorage for retrieval after login
    localStorage.setItem("aba_sensei_language", lang)
    // Redirect to login page
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🥋</div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Login/Signup buttons for guests */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
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
      </div>

      <LanguageSelection onSelect={handleLanguageSelect} />
    </div>
  )
}
