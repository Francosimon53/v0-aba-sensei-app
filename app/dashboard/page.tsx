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

        console.log("[v0] Dashboard: Progress response:", { count: progressData?.length, error: progressError })

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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🥋</div>
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="bg-white/5 border-red-500/30 backdrop-blur-sm p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-white/60 mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  window.location.reload()
                }}
                className="w-full bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 border border-yellow-400/30"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="ghost"
                className="w-full text-white/60 hover:text-white/80"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const isNewUser = userStats?.totalQuestions === 0 && domainProgress.length === 0

  return (
    <div className="min-h-screen gradient-bg">
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🥋</div>
              <div>
                <h1 className="text-xl font-bold text-white">ABA Sensei</h1>
                <p className="text-sm text-white/60">Dashboard</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="text-white/60 hover:text-white/80">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {userProfile?.fullName}!</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-500/30">
            <span className="text-yellow-400 font-bold">{userProfile?.examLevel}</span>
            <span className="text-white/60">Candidate</span>
          </div>
        </div>

        {isNewUser ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🥋</div>
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Begin Your Journey?</h3>
              <p className="text-lg text-white/60 mb-8">
                Start your first study session and begin mastering ABA concepts with personalized feedback and expert
                guidance.
              </p>
              <Button
                onClick={() => router.push("/study")}
                className="h-16 px-8 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-xl"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <div className="text-white/60 text-sm mb-2">Total Questions</div>
                <div className="text-4xl font-bold text-yellow-400">{userStats?.totalQuestions || 0}</div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <div className="text-white/60 text-sm mb-2">Accuracy Rate</div>
                <div className="text-4xl font-bold text-yellow-400">{userStats?.accuracyRate || 0}%</div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <div className="text-white/60 text-sm mb-2">Current Streak</div>
                <div className="text-4xl font-bold text-yellow-400 flex items-center gap-2">
                  {userStats?.currentStreak || 0}
                  <span className="text-2xl">🔥</span>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <div className="text-white/60 text-sm mb-2">Best Streak</div>
                <div className="text-4xl font-bold text-yellow-400 flex items-center gap-2">
                  {userStats?.bestStreak || 0}
                  <span className="text-2xl">⭐</span>
                </div>
              </Card>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Progress by Domain</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainProgress.map((domain) => {
                  const progress =
                    domain.questionsAttempted > 0
                      ? Math.round((domain.questionsCorrect / domain.questionsAttempted) * 100)
                      : 0
                  const badge = getMasteryBadge(domain.masteryLevel)

                  return (
                    <Card key={domain.domain} className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-semibold text-sm leading-tight">{domain.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs border ${badge.className}`}>{badge.label}</div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span>
                            {domain.questionsCorrect}/{domain.questionsAttempted}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => router.push(`/study?category=${domain.domain}`)}
                        className="w-full bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 border border-yellow-400/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📚</span>
                          <span>Continue</span>
                        </div>
                      </Button>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Recent Activity</h3>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
                <div className="divide-y divide-white/10">
                  {recentSessions.length === 0 ? (
                    <div className="p-6 text-center text-white/40">
                      No recent sessions. Start studying to see your activity here!
                    </div>
                  ) : (
                    recentSessions.map((session) => (
                      <div key={session.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-white font-medium mb-1">Domain {session.categoryId}</div>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <span>{formatDate(session.startedAt)}</span>
                              <span>
                                {session.correctAnswers}/{session.totalQuestions} correct
                              </span>
                              <span>{formatDuration(session.durationSeconds)}</span>
                              <span className="capitalize">{session.mode} mode</span>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {session.totalQuestions > 0
                              ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push(lastCategory ? `/study?category=${lastCategory}` : "/study")}
                  className="h-24 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">📚</span>
                    <span>Continue Studying</span>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push("/study")}
                  className="h-24 bg-white/10 hover:bg-white/20 text-white font-bold text-lg border border-white/20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <span>Start New Session</span>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push("/study?mode=exam")}
                  className="h-24 bg-white/10 hover:bg-white/20 text-white font-bold text-lg border border-white/20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span>Take Mock Exam</span>
                  </div>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
