"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Settings, Target, Zap, Flame, Clock, TrendingUp, Award, BookOpen, Brain, ChevronRight, Lock, Play } from "lucide-react"

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
  date: string
}

interface UserProfile {
  fullName: string
  examLevel: string
  memberSince: string
  subscriptionTier?: string
}

interface WeakArea {
  categoryId: string
  categoryName: string
  accuracy: number
  attempted: number
  correct: number
}

interface Achievement {
  id: string
  name: string
  icon: string
  unlocked: boolean
  progress?: number
  target?: number
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push("/auth/login")
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, exam_level, preferred_language, subscription_tier")
          .eq("id", user.id)
          .single()

        const createdAt = user.created_at ? new Date(user.created_at) : new Date()
        const memberSince = createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })

        setUserProfile({
          fullName: profile?.full_name || "Student",
          examLevel: profile?.exam_level?.toUpperCase() || "BCBA",
          memberSince,
          subscriptionTier: profile?.subscription_tier || "free",
        })

        // Fetch user progress with category information
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)

        // Fetch all categories to map IDs to names
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, code, name")

        const categoryMap = new Map(
          categoriesData?.map(c => [c.id, { code: c.code, name: c.name }]) || []
        )

        if (progressData && progressData.length > 0) {
          const totalQuestions = progressData.reduce((sum, p) => sum + (p.questions_attempted || 0), 0)
          const totalCorrect = progressData.reduce((sum, p) => sum + (p.questions_correct || 0), 0)
          const totalStudyTime = progressData.reduce((sum, p) => sum + (p.total_study_time_seconds || 0), 0)
          const maxStreak = Math.max(...progressData.map((p) => p.current_streak || 0), 0)
          const maxBestStreak = Math.max(...progressData.map((p) => p.best_streak || 0), 0)

          setUserStats({
            totalQuestions,
            accuracyRate: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            currentStreak: maxStreak,
            bestStreak: maxBestStreak,
            studyMinutes: Math.round(totalStudyTime / 60) || Math.round(totalQuestions * 1.5),
          })

          // Calculate weak areas from progress data with real category names
          const categoryStats: WeakArea[] = progressData
            .filter(p => p.questions_attempted > 0)
            .map(p => {
              const catInfo = categoryMap.get(p.category_id)
              return {
                categoryId: p.category_id,
                categoryName: catInfo ? `${catInfo.code}. ${catInfo.name}` : p.category_id || "General",
                accuracy: Math.round((p.questions_correct / p.questions_attempted) * 100),
                attempted: p.questions_attempted,
                correct: p.questions_correct
              }
            })
            .sort((a, b) => a.accuracy - b.accuracy) // Sort by lowest accuracy first
            .slice(0, 4) // Show top 4 weakest areas
          
          setWeakAreas(categoryStats)
        } else {
          setUserStats({
            totalQuestions: 0,
            accuracyRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            studyMinutes: 0,
          })
          setWeakAreas([])
        }

        // Generate weekly data from question_attempts for more accurate tracking
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        
        const { data: attemptsData } = await supabase
          .from("question_attempts")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", sevenDaysAgo)

        // Also get session data as fallback
        const { data: sessionsData } = await supabase
          .from("study_sessions")
          .select("started_at, total_questions")
          .eq("user_id", user.id)
          .gte("started_at", sevenDaysAgo)

        const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const today = new Date()
        const weekly: WeeklyData[] = []

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dayOfWeek = date.getDay()
          const dayStr = date.toISOString().split("T")[0]

          // Count attempts for this day
          const attemptsForDay = attemptsData?.filter((a) => a.created_at?.startsWith(dayStr)).length || 0
          
          // Fallback to sessions data if no attempts
          const sessionsForDay = sessionsData
            ?.filter((s) => s.started_at?.startsWith(dayStr))
            .reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0

          weekly.push({
            label: dayLabels[dayOfWeek],
            questions: attemptsForDay > 0 ? attemptsForDay : sessionsForDay,
            date: dayStr,
          })
        }

        setWeeklyData(weekly)

        // Set achievements based on stats with progress tracking
        const stats = progressData && progressData.length > 0 ? {
          totalQuestions: progressData.reduce((sum, p) => sum + (p.questions_attempted || 0), 0),
          bestStreak: Math.max(...progressData.map((p) => p.best_streak || 0), 0),
        } : { totalQuestions: 0, bestStreak: 0 }

        setAchievements([
          { id: "first", name: "First Steps", icon: "🎯", unlocked: stats.totalQuestions >= 1, progress: Math.min(stats.totalQuestions, 1), target: 1 },
          { id: "10q", name: "10 Questions", icon: "📝", unlocked: stats.totalQuestions >= 10, progress: Math.min(stats.totalQuestions, 10), target: 10 },
          { id: "50q", name: "50 Questions", icon: "🏅", unlocked: stats.totalQuestions >= 50, progress: Math.min(stats.totalQuestions, 50), target: 50 },
          { id: "100q", name: "Century", icon: "💯", unlocked: stats.totalQuestions >= 100, progress: Math.min(stats.totalQuestions, 100), target: 100 },
          { id: "streak3", name: "3-Day Streak", icon: "🔥", unlocked: stats.bestStreak >= 3, progress: Math.min(stats.bestStreak, 3), target: 3 },
          { id: "streak7", name: "Week Warrior", icon: "⚡", unlocked: stats.bestStreak >= 7, progress: Math.min(stats.bestStreak, 7), target: 7 },
        ])

        setLoading(false)
      } catch (err) {
        console.error("Dashboard error:", err)
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

  const handleManageSubscription = async () => {
    if (!userId) return
    
    setPortalLoading(true)
    setPortalError(null)
    
    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError(data.error || "Failed to open subscription portal")
        setPortalLoading(false)
      }
    } catch (error) {
      console.error("Portal error:", error)
      setPortalError("Failed to open subscription portal")
      setPortalLoading(false)
    }
  }

  const maxQuestions = Math.max(...weeklyData.map((d) => d.questions), 1)
  
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return "text-emerald-400"
    if (accuracy >= 50) return "text-amber-400"
    return "text-red-400"
  }

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 70) return "from-emerald-500/20 to-emerald-500/5"
    if (accuracy >= 50) return "from-amber-500/20 to-amber-500/5"
    return "from-red-500/20 to-red-500/5"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥋</span>
            <span className="font-semibold text-white">ABA Sensei</span>
          </div>
          <span className="text-[10px] text-zinc-500 tracking-wide ml-9">by Simon Franco</span>
        </div>
        <div className="flex items-center gap-4">
          {userProfile?.subscriptionTier === "pro" || userProfile?.subscriptionTier === "annual" ? (
            <button 
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              {portalLoading ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <Link href="/pricing" className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors">
              Upgrade to Pro
            </Link>
          )}
          <button onClick={handleLogout} className="text-zinc-500 hover:text-white text-sm transition-colors">
            Logout
          </button>
        </div>
      </header>
      
      {/* Portal Error Toast */}
      {portalError && (
        <div className="fixed top-4 right-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm z-50 backdrop-blur-sm">
          {portalError}
          <button onClick={() => setPortalError(null)} className="ml-3 text-red-300 hover:text-white">
            Close
          </button>
        </div>
      )}

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Welcome Section with Gradient */}
        <div className="relative mb-12 p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border border-white/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <p className="text-zinc-500 text-sm mb-2 tracking-wide uppercase">Welcome back</p>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{userProfile?.fullName || "Student"}</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500 font-semibold">{userProfile?.examLevel || "BCBA"} Candidate</span>
            </div>
          </div>
        </div>

        {/* Stats Grid with Glassmorphism */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Questions */}
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-zinc-400 text-sm">Questions</p>
              </div>
              <p className="text-4xl font-bold text-white tracking-tight">{userStats?.totalQuestions || 0}</p>
            </div>
          </div>

          {/* Accuracy */}
          <div className={`group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${getAccuracyBg(userStats?.accuracyRate || 0)} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${userStats?.accuracyRate && userStats.accuracyRate >= 70 ? 'bg-emerald-500/10' : userStats?.accuracyRate && userStats.accuracyRate >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                  <TrendingUp className={`w-4 h-4 ${getAccuracyColor(userStats?.accuracyRate || 0)}`} />
                </div>
                <p className="text-zinc-400 text-sm">Accuracy</p>
              </div>
              <p className={`text-4xl font-bold tracking-tight ${getAccuracyColor(userStats?.accuracyRate || 0)}`}>
                {userStats?.accuracyRate || 0}%
              </p>
            </div>
          </div>

          {/* Current Streak */}
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-zinc-400 text-sm">Streak</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-white tracking-tight">{userStats?.currentStreak || 0}</p>
                <span className="text-lg text-zinc-500">days</span>
              </div>
            </div>
          </div>

          {/* Study Time */}
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-zinc-400 text-sm">Study Time</p>
              </div>
              <p className="text-4xl font-bold text-white tracking-tight">
                {formatStudyTime(userStats?.studyMinutes || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Action Cards - Centered & Prominent */}
        <div className="flex justify-center mb-16 mt-4">
          <div className="w-full max-w-[800px] grid md:grid-cols-2 gap-6">
            {/* AI Sensei Card */}
            <Link href="/tutor" className="block group">
              <div className="relative min-h-[180px] bg-gradient-to-br from-amber-500 via-amber-500 to-orange-600 rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:scale-[1.03] shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                {/* Animated gradient border glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-0 group-hover:opacity-100 animate-pulse -z-10 blur-xl" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <div className="relative flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-black/70" />
                        <span className="text-xs font-bold text-black/60 uppercase tracking-wider">AI Powered</span>
                      </div>
                      <h3 className="text-3xl font-bold text-black mb-2">AI Sensei</h3>
                      <p className="text-black/70 text-sm">Personalized practice with your AI tutor</p>
                    </div>
                    <div className="text-5xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🥋</div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-black/50">{userStats?.totalQuestions || 0} questions completed</span>
                    <div className="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-4 py-2 rounded-full transition-colors">
                      <span className="text-sm font-semibold text-black">Start Practice</span>
                      <ChevronRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Study Mode Card */}
            <Link href="/study" className="block group">
              <div className="relative min-h-[180px] bg-gradient-to-br from-zinc-800/80 via-zinc-900 to-black rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:scale-[1.03] border border-white/10 hover:border-amber-500/40 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <div className="relative flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-amber-500/70" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Self-Paced</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2">Study Mode</h3>
                      <p className="text-zinc-400 text-sm">Practice by category & difficulty</p>
                    </div>
                    <div className="text-5xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">📚</div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-zinc-600">Choose your topic</span>
                    <div className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-full transition-colors">
                      <span className="text-sm font-semibold text-amber-500">Start Now</span>
                      <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Video Mode Card - Full Width */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-[800px]">
            <Link href="/video" className="block group">
              <div className="relative min-h-[140px] bg-gradient-to-br from-purple-900/40 via-zinc-900 to-black rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_rgba(147,51,234,0.2)]">
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <div className="relative flex items-center justify-between h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                      <Play className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Visual Learning</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">Video Mode</h3>
                      <p className="text-zinc-400 text-sm">Watch animated explanations before practicing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🎬</span>
                    <div className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-full transition-colors">
                      <span className="text-sm font-semibold text-purple-400">Watch & Learn</span>
                      <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Weekly Progress</h2>
            </div>
            <span className="text-sm text-zinc-500">Last 7 days</span>
          </div>
          {weeklyData.some(d => d.questions > 0) ? (
            <div className="flex items-end gap-3 h-40">
              {weeklyData.map((day, i) => {
                const isToday = i === weeklyData.length - 1
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="relative w-full flex-1 flex items-end justify-center">
                      {/* Question count tooltip */}
                      {day.questions > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.questions}
                        </span>
                      )}
                      <div
                        className={`w-full max-w-[40px] rounded-lg transition-all duration-300 group-hover:scale-105 ${
                          isToday 
                            ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                            : 'bg-gradient-to-t from-amber-500/60 to-amber-400/40 hover:from-amber-500/80 hover:to-amber-400/60'
                        }`}
                        style={{
                          height: `${Math.max((day.questions / maxQuestions) * 100, day.questions > 0 ? 15 : 4)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <span className={`text-xs font-medium ${isToday ? 'text-amber-500' : 'text-zinc-500'}`}>
                        {day.label}
                      </span>
                      {day.questions > 0 && (
                        <p className="text-xs text-zinc-600 mt-0.5">{day.questions}q</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 text-sm mb-1">No practice data yet</p>
              <p className="text-zinc-600 text-xs mb-4">Start practicing to track your weekly progress!</p>
              <Link 
                href="/tutor" 
                className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1"
              >
                Start practicing <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Focus Areas */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-white">Focus Areas</h2>
              </div>
              <span className="text-xs text-zinc-500">Sorted by lowest accuracy</span>
            </div>
            {weakAreas.length > 0 ? (
              <div className="space-y-3">
                {weakAreas.map((area, i) => (
                  <div 
                    key={area.categoryId || i} 
                    className={`relative p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                      area.accuracy < 50 
                        ? 'bg-red-500/5 border-red-500/20' 
                        : area.accuracy < 70 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}
                  >
                    {/* Progress bar background */}
                    <div 
                      className={`absolute inset-0 rounded-xl opacity-10 ${
                        area.accuracy < 50 ? 'bg-red-500' : area.accuracy < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${area.accuracy}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{area.categoryName}</p>
                        <p className="text-xs text-zinc-500">{area.correct}/{area.attempted} correct</p>
                      </div>
                      <div className={`text-xl font-bold ml-4 ${getAccuracyColor(area.accuracy)}`}>
                        {area.accuracy}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-sm mb-1">No data yet</p>
                <p className="text-zinc-600 text-xs">Complete more questions to see your focus areas</p>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-white">Achievements</h2>
              </div>
              <span className="text-xs text-zinc-500">
                {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`relative flex flex-col items-center p-3 rounded-xl transition-all group ${
                    achievement.unlocked 
                      ? 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'bg-white/[0.02] border border-white/5'
                  }`}
                >
                  {/* Icon with conditional styling */}
                  <div className="relative">
                    <span className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'grayscale opacity-40'}`}>
                      {achievement.icon}
                    </span>
                    {!achievement.unlocked && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-zinc-500" />
                      </div>
                    )}
                  </div>
                  
                  <span className={`text-xs text-center mt-1 ${achievement.unlocked ? 'text-amber-400 font-medium' : 'text-zinc-500'}`}>
                    {achievement.name}
                  </span>
                  
                  {/* Progress indicator for locked achievements */}
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.target !== undefined && (
                    <div className="w-full mt-2">
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500/50 rounded-full transition-all"
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-600 text-center mt-1">
                        {achievement.progress}/{achievement.target}
                      </p>
                    </div>
                  )}
                  
                  {/* Glow effect for unlocked */}
                  {achievement.unlocked && (
                    <div className="absolute inset-0 rounded-xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            Best Streak: <span className="text-white font-semibold">{userStats?.bestStreak || 0} days</span>
          </div>
          <div className="hidden sm:block text-zinc-700">|</div>
          <div>
            Member since <span className="text-white font-semibold">{userProfile?.memberSince || "Today"}</span>
          </div>
        </div>
      </main>
    </div>
  )
}
