"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check } from "lucide-react"
import Loading from "./loading"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    if (sessionId) {
      // Verify the session and update user subscription status
      fetch(`/api/stripe/verify?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus("success")
          } else {
            setStatus("error")
          }
        })
        .catch(() => setStatus("error"))
    } else {
      setStatus("success") // No session to verify, assume success
    }
  }, [sessionId])

  if (status === "loading") {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to Pro!</h1>
        <p className="text-zinc-400 mb-8">
          Your subscription is now active. You have unlimited access to all features including AI Sensei tutoring.
        </p>

        <div className="space-y-3">
          <Link
            href="/tutor"
            className="block w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
          >
            Start Practicing with AI Sensei
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
