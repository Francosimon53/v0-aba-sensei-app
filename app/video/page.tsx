"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VideoLearningPlayer } from "@/components/video-learning-player"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Target, Trophy, ChevronRight, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isForeverFreeUser } from "@/lib/constants"

// RBT 3rd Edition Task List (2026)
const RBT_CATEGORIES = [
  "A. Data Collection and Graphing",
  "B. Behavior Assessment",
  "C. Behavior Acquisition",
  "D. Behavior Reduction",
  "E. Documentation and Reporting",
  "F. Ethics",
]

// BCBA 6th Edition Task List (2025)
const BCBA_CATEGORIES = [
  "A. Behaviorism and Philosophical Foundations",
  "B. Concepts and Principles",
  "C. Measurement, Data Display, and Interpretation",
  "D. Experimental Design",
  "E. Ethical and Professional Issues",
  "F. Behavior Assessment",
  "G. Behavior-Change Procedures",
  "H. Selecting and Implementing Interventions",
  "I. Personnel Supervision and Management",
]

interface GameStats {
  correctToday: number
  dailyGoal: number
}

export default function VideoModePage() {
  const router = useRouter()
  const [examLevel, setExamLevel] = useState<"bcba" | "rbt">("bcba")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [gameStats, setGameStats] = useState<GameStats>({
    correctToday: 0,
    dailyGoal: 10,
  })
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free")
  const progressPercent = 80

  useEffect(() => {
    const checkSubscription = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        if (isForeverFreeUser(user.email)) {
          setSubscriptionTier("pro")
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", user.id)
            .single()
          
          if (profile?.subscription_tier) {
            setSubscriptionTier(profile.subscription_tier)
          }
        }
      }
    }
    
    checkSubscription()
  }, [])

  const handleStartQuiz = () => {
    // Navigate to tutor with selected settings via URL params
    const params = new URLSearchParams({
      level: examLevel,
      category: selectedCategory,
      difficulty: difficulty,
    })
    router.push(`/tutor?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      {/* Header */}
      <header className="px-3 sm:px-4 py-3 sm:py-4 border-b border-zinc-800/50 flex items-center justify-between gap-3">
        {/* Left: Back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="text-white/60 hover:text-white/80 text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        
        {/* Center: Title */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <span className="text-white font-semibold text-sm sm:text-base">Video Mode</span>
        </div>
        
        {/* Right: Stats placeholder */}
        <div className="w-20" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Level toggle */}
        <div className="flex bg-[#1a1a24] rounded-full p-1 mb-8 border border-zinc-800/50">
          <button
            onClick={() => {
              setExamLevel("rbt")
              setSelectedCategory("all")
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              examLevel === "rbt" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            RBT
          </button>
          <button
            onClick={() => {
              setExamLevel("bcba")
              setSelectedCategory("all")
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              examLevel === "bcba" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            BCBA
          </button>
        </div>

        {/* Video Learning Player */}
        <VideoLearningPlayer autoPlay={true} />

        {/* Logo and title */}
        <div className="text-4xl mb-3 opacity-90">🥋</div>
        <h1 className="text-xl font-semibold text-white mb-1 tracking-tight">ABA Sensei</h1>
        <p className="text-zinc-500 text-center text-sm mb-6">
          Watch and learn before you practice
        </p>

        {/* Category selection */}
        <div className="w-full max-w-md mb-8">
          <p className="text-zinc-400 text-sm text-center mb-3">Select Category</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                selectedCategory === "all"
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              All Categories
            </button>
            {(examLevel === "bcba" ? BCBA_CATEGORIES : RBT_CATEGORIES).map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="mt-6 w-full max-w-md mb-8">
          <p className="text-zinc-400 text-sm mb-3 text-center">Difficulty Level</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Easy */}
            <button
              onClick={() => setDifficulty("Easy")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                difficulty === "Easy"
                  ? "border-green-500 bg-green-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="text-2xl mb-1">🌱</div>
              <div className={`font-semibold ${difficulty === "Easy" ? "text-green-400" : "text-white"}`}>
                Easy
              </div>
              <div className="text-xs text-zinc-500">Fundamentals</div>
              {difficulty === "Easy" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
            </button>

            {/* Medium */}
            <button
              onClick={() => setDifficulty("Medium")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                difficulty === "Medium"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="text-2xl mb-1">🔥</div>
              <div className={`font-semibold ${difficulty === "Medium" ? "text-amber-400" : "text-white"}`}>
                Medium
              </div>
              <div className="text-xs text-zinc-500">Application</div>
              {difficulty === "Medium" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
            </button>

            {/* Hard */}
            <button
              onClick={() => setDifficulty("Hard")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                difficulty === "Hard"
                  ? "border-red-500 bg-red-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="text-2xl mb-1">💀</div>
              <div className={`font-semibold ${difficulty === "Hard" ? "text-red-400" : "text-white"}`}>
                Hard
              </div>
              <div className="text-xs text-zinc-500">Exam-level</div>
              {difficulty === "Hard" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-32 h-32 mb-8">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="#1f1f1f" strokeWidth="6" />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progressPercent * 3.52} 352`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Target className="w-7 h-7 text-amber-500/80 mb-1" />
            <span className="text-white font-medium">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Start Quiz button */}
        <Button
          onClick={handleStartQuiz}
          className="w-full max-w-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold py-6 text-base rounded-xl transition-all duration-150"
        >
          Start Quiz Practice
        </Button>

        {/* Daily goal card */}
        <div className="mt-8 bg-zinc-900/80 rounded-xl p-4 w-full max-w-xs border border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500/80" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Daily Goal</p>
                <p className="text-zinc-500 text-xs">
                  {gameStats.correctToday}/{gameStats.dailyGoal} correct
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
