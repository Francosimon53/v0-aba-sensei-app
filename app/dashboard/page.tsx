"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface UserStats {
  totalQuestions: number
  accuracyRate: number
  currentStreak: number
  bestStreak: number
}

interface DomainProgress {
  domain: string
  name: string
  questionsCorrect: number
  questionsAttempted: number
  masteryLevel: string
  lastPracticedAt: string | null
}

interface RecentSession {
  id: string
  categoryId: string
  totalQuestions: number
  correctAnswers: number
  durationSeconds: number
  startedAt: string
  mode: string
}

interface UserProfile {
  fullName: string
  examLevel: string
  preferredLanguage: string
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [domainProgress, setDomainProgress] = useState<DomainProgress[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCategory, setLastCategory] = useState<string | null>(null)
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

        if (profile) {
          setUserProfile({
            fullName: profile.full_name || "Student",
            examLevel: profile.exam_level?.toUpperCase() || "BCBA",
            preferredLanguage: profile.preferred_language || "en",
          })
        } else {
          setUserProfile({
            fullName: "Student",
            examLevel: "BCBA",
            preferredLanguage: "en",
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
          })

          const domainNames: Record<string, string> = {
            A: "A. Behaviorism & Philosophical Foundations",
            B: "B. Concepts and Principles",
            C: "C. Measurement, Data Display, & Interpretation",
            D: "D. Experimental Design",
            E: "E. Ethical and Professional Issues",
            F: "F. Behavior Assessment",
            G: "G. Behavior-Change Procedures",
            H: "H. Selecting & Implementing Interventions",
            I: "I. Personnel Supervision & Management",
          }

          const domains = progressData
            .filter((p) => p.category_id != null) // Filter out null category_ids
            .map((p) => ({
              domain: p.category_id,
              name: domainNames[p.category_id] || p.category_id,
              questionsCorrect: p.questions_correct || 0,
              questionsAttempted: p.questions_attempted || 0,
              masteryLevel: p.mastery_level || "novice",
              lastPracticedAt: p.last_practiced_at,
            }))

          const sorted = [...domains].sort((a, b) => {
            const dateA = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0
            const dateB = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0
            return dateB - dateA
          })

          if (sorted.length > 0 && sorted[0].domain) {
            setLastCategory(sorted[0].domain)
          }

          setDomainProgress(
            domains.sort((a, b) => {
              if (!a.domain || !b.domain) return 0
              return a.domain.localeCompare(b.domain)
            }),
          )
        } else {
          console.log("[v0] Dashboard: No progress data found - new user")
          setUserStats({
            totalQuestions: 0,
            accuracyRate: 0,
            currentStreak: 0,
            bestStreak: 0,
          })
          setDomainProgress([])
        }

        console.log("[v0] Dashboard: Loading sessions...")
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(5)

        console.log("[v0] Dashboard: Sessions response:", { count: sessionsData?.length, error: sessionsError })

        if (sessionsError) {
          console.error("[v0] Dashboard: Sessions error:", sessionsError)
          // Continue even if sessions fail
        }

        if (sessionsData) {
          setRecentSessions(
            sessionsData.map((s) => ({
              id: s.id,
              categoryId: s.category_id,
              totalQuestions: s.total_questions,
              correctAnswers: s.correct_answers,
              durationSeconds: s.duration_seconds,
              startedAt: s.started_at,
              mode: s.mode,
            })),
          )
        }

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

  const getMasteryBadge = (level: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      novice: { label: "Novice", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
      intermediate: { label: "Learning", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      advanced: { label: "Proficient", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      master: {
        label: "Expert",
        className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-500",
      },
    }
    return badges[level] || badges["novice"]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return mins < 1 ? "<1 min" : `${mins} min`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getAllDomains = () => {
    const allDomainNames: Record<string, string> = {
      A: "Behaviorism & Philosophical Foundations",
      B: "Concepts and Principles",
      C: "Measurement, Data Display, & Interpretation",
      D: "Experimental Design",
      E: "Ethical and Professional Issues",
      F: "Behavior Assessment",
      G: "Behavior-Change Procedures",
      H: "Selecting & Implementing Interventions",
      I: "Personnel Supervision & Management",
    }

    return Object.entries(allDomainNames).map(([letter, name]) => {
      const existing = domainProgress.find((d) => d.domain === letter)
      if (existing) {
        return existing
      }
      return {
        domain: letter,
        name,
        questionsCorrect: 0,
        questionsAttempted: 0,
        masteryLevel: "novice",
        lastPracticedAt: null,
      }
    })
  }

  const shouldShowEmptyState = userStats?.totalQuestions === 0 && recentSessions.length === 0

  return (
    <div className="min-h-screen gradient-bg">
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🥋</div>
              <div>
                <h1 className="text-lg font-bold text-white">ABA Sensei</h1>
                <p className="text-xs text-white/50">Dashboard</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="text-white/60 hover:text-white/80 text-sm">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Welcome back, {userProfile?.fullName}!</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-500/30">
            <span className="text-yellow-400 font-semibold text-sm">{userProfile?.examLevel}</span>
            <span className="text-white/60 text-sm">Candidate</span>
          </div>
        </div>

        {shouldShowEmptyState ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🥋</div>
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Begin Your Journey?</h3>
              <p className="text-lg text-white/60 mb-8">
                Start your first study session and begin mastering ABA concepts with personalized feedback and expert
                guidance.
              </p>
              <Button
                onClick={() => router.push("/sensei")}
                className="h-16 px-8 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-xl shadow-lg shadow-yellow-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📚</span>
                  <span>Start Your First Study Session</span>
                </div>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <Card className="relative bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md p-5 hover:border-yellow-400/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Total Questions</div>
                  <div className="text-3xl font-bold text-white">{userStats?.totalQuestions || 0}</div>
                </div>
              </Card>

              <Card className="relative bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md p-5 hover:border-yellow-400/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Accuracy</div>
                  <div className="text-3xl font-bold text-yellow-400">{userStats?.accuracyRate || 0}%</div>
                </div>
              </Card>

              <Card className="relative bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md p-5 hover:border-yellow-400/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Current Streak</div>
                  <div className="text-3xl font-bold text-white flex items-center gap-2">
                    {userStats?.currentStreak || 0}
                    <span className="text-xl">🔥</span>
                  </div>
                </div>
              </Card>

              <Card className="relative bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md p-5 hover:border-yellow-400/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Best Streak</div>
                  <div className="text-3xl font-bold text-white flex items-center gap-2">
                    {userStats?.bestStreak || 0}
                    <span className="text-xl">⭐</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push("/sensei")}
                  className="h-14 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold shadow-lg shadow-yellow-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📚</span>
                    <span>Continue Studying</span>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push("/sensei")}
                  className="h-14 bg-transparent hover:bg-white/10 text-white font-semibold border border-white/20 hover:border-yellow-400/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎯</span>
                    <span>New Category</span>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push("/sensei?tab=exam")}
                  className="h-14 bg-transparent hover:bg-white/10 text-white font-semibold border border-white/20 hover:border-yellow-400/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎓</span>
                    <span>Exam Mode</span>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push("/admin/embeddings")}
                  className="h-14 bg-transparent hover:bg-purple-500/20 text-white font-semibold border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚙️</span>
                    <span>Generate Embeddings</span>
                  </div>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
              {recentSessions.length === 0 ? (
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8 text-center">
                  <p className="text-white/60">No recent sessions. Start studying to see your activity here!</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="bg-white/5 border-white/10 backdrop-blur-sm p-4 hover:border-yellow-400/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium mb-1">{session.categoryId || "General Study"}</div>
                          <div className="text-sm text-white/50">
                            {session.correctAnswers}/{session.totalQuestions} correct (
                            {Math.round((session.correctAnswers / session.totalQuestions) * 100)}%) ·{" "}
                            {formatDuration(session.durationSeconds)} · {formatDate(session.startedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.mode === "exam" && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Exam Mode
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
