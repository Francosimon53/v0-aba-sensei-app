"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // User is logged in, redirect to dashboard
        router.push("/dashboard")
      } else {
        // Show welcome screen for guests
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🥋</div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-4">🥋</div>
      <h1 className="text-3xl font-bold text-white mb-2">ABA Sensei</h1>
      <p className="text-zinc-400 mb-8">Master your BCBA & RBT exam</p>
      
      <div className="space-y-4 w-full max-w-xs">
        <Link href="/dashboard">
          <Button className="w-full bg-[#d4a853] hover:bg-[#c49845] text-black font-bold py-4">
            Get Started
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full border-zinc-800 text-white py-4 hover:bg-zinc-900 bg-transparent">
            Login
          </Button>
        </Link>
      </div>
    </div>
  )
}
