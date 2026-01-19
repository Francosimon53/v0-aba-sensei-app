"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface UserStats {
  totalQuestions: number
  accuracyRate: number
  currentStreak: number
  bestStreak: number
  studyMinutes: number
}

interface WeeklyData {
  label: string
  questions: number
}

interface UserProfile {
  fullName: string
  examLevel: string
  memberSince: string
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        console.log("[v0] Dashboard: Starting to load data...")
        const supabase = createClient()
        console.log("[v0] Dashboard: Supabase client created")

        console.log("[v0] Dashboard: Checking auth status...")
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        console.log("[v0] Dashboard: Auth response:", { user: user?.id, error: authError })

        if (authError) {
          console.error("[v0] Dashboard: Auth error:", authError)
          setError("Authentication error. Please log in again.")
          setLoading(false)
          setTimeout(() => router.push("/auth/login"), 2000)
          return
        }

        if (!user) {
          console.log("[v0] Dashboard: No user found, redirecting to login")
          router.push("/auth/login")
          return
        }

        console.log("[v0] Dashboard: User authenticated:", user.id)

        console.log("[v0] Dashboard: Loading profile...")
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, exam_level, preferred_language")
          .eq("id", user.id)
          .single()

        console.log("[v0] Dashboard: Profile response:", { profile, error: profileError })

        if (profileError) {
          console.error("[v0] Dashboard: Profile error:", profileError)
          // Continue even if profile fails - show default values
        }

        const createdAt = user.created_at ? new Date(user.created_at) : new Date()
        const memberSince = createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })

        if (profile) {
          setUserProfile({
            fullName: profile.full_name || "Student",
            examLevel: profile.exam_level?.toUpperCase() || "BCBA",
            memberSince,
          })
        } else {
          setUserProfile({
            fullName: "Student",
            examLevel: "BCBA",
            memberSince,
          })
        }

        console.log("[v0] Dashboard: Loading progress...")
        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)

        console.log("[v0] Dashboard: Progress response:", {
          count: progressData?.length,
          data: progressData, // Log the actual data to see what's in the table
          error: progressError,
        })

        if (progressError) {
          console.error("[v0] Dashboard: Progress error:", progressError)
          setError(`Error loading progress: ${progressError.message}`)
          setLoading(false)
          return
        }

        if (progressData && progressData.length > 0) {
          const totalQuestions = progressData.reduce((sum, p) => sum + p.questions_attempted, 0)
          const totalCorrect = progressData.reduce((sum, p) => sum + p.questions_correct, 0)
          const maxStreak = Math.max(...progressData.map((p) => p.current_streak), 0)
          const maxBestStreak = Math.max(...progressData.map((p) => p.best_streak), 0)

          setUserStats({
            totalQuestions,
            accuracyRate: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            currentStreak: maxStreak,
            bestStreak: maxBestStreak,
            studyMinutes: Math.round(totalQuestions * 1.5), // Estimate ~1.5 min per question
          })
        } else {
          setUserStats({
            totalQuestions: 0,
            accuracyRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            studyMinutes: 0,
          })
        }

        // Generate weekly data from sessions
        const { data: sessionsData } = await supabase
          .from("study_sessions")
          .select("started_at, total_questions")
          .eq("user_id", user.id)
          .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const today = new Date()
        const weekly: WeeklyData[] = []

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dayOfWeek = date.getDay()
          const dayStr = date.toISOString().split("T")[0]

          const questionsForDay = sessionsData
            ?.filter((s) => s.started_at?.startsWith(dayStr))
            .reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0

          weekly.push({
            label: dayLabels[dayOfWeek],
            questions: questionsForDay,
          })
        }

        setWeeklyData(weekly)

        console.log("[v0] Dashboard: Data loading complete")
        setLoading(false)
      } catch (err) {
        console.error("[v0] Dashboard: Unexpected error:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const maxQuestions = Math.max(...weeklyData.map((d) => d.questions), 1)
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🥋</span>
          <span className="font-semibold text-white">ABA Sensei</span>
        </div>
        <button onClick={handleLogout} className="text-zinc-500 hover:text-white text-sm transition-colors">
          Logout
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <p className="text-zinc-500 text-sm mb-1">Welcome back</p>
          <h1 className="text-4xl font-bold text-white">{userProfile?.fullName || "Student"}</h1>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <span className="text-amber-500 text-sm font-medium">{userProfile?.examLevel || "BCBA"} Candidate</span>
          </div>
        </div>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-2">Questions Practiced</p>
            <p className="text-5xl font-bold text-white tracking-tight">{userStats?.totalQuestions || 0}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-2">Accuracy</p>
            <p className="text-5xl font-bold text-green-400 tracking-tight">{userStats?.accuracyRate || 0}%</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-2">Current Streak</p>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-white tracking-tight">{userStats?.currentStreak || 0}</p>
              <span className="text-2xl">🔥</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-2">Study Time</p>
            <p className="text-5xl font-bold text-white tracking-tight">
              {formatStudyTime(userStats?.studyMinutes || 0)}
            </p>
          </div>
        </div>

        {/* Main Actions - Only 2 */}
        <div className="space-y-4 mb-12">
          <Link href="/tutor" className="block">
            <div className="group bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 hover:scale-[1.01] transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-black">AI Sensei</h3>
                  <p className="text-black/70">Personalized practice with AI tutor</p>
                </div>
                <div className="text-4xl group-hover:translate-x-1 transition-transform">🥋</div>
              </div>
            </div>
          </Link>

          <Link href="/study" className="block">
            <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Study Mode</h3>
                  <p className="text-zinc-400">Practice by category & difficulty</p>
                </div>
                <div className="text-4xl group-hover:translate-x-1 transition-transform">📚</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Weekly Progress Chart */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">This Week</h2>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-amber-500/80 rounded-t-lg transition-all hover:bg-amber-500"
                  style={{
                    height: `${(day.questions / maxQuestions) * 100}%`,
                    minHeight: day.questions > 0 ? "8px" : "2px",
                  }}
                />
                <span className="text-xs text-zinc-500">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="pt-8 border-t border-zinc-900 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-zinc-500">
          <div>
            Best Streak: <span className="text-white font-medium">{userStats?.bestStreak || 0} 🏆</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div>
            Member since <span className="text-white font-medium">{userProfile?.memberSince || "Today"}</span>
          </div>
        </div>
      </main>
    </div>
  )
}
