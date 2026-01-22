"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { CheckCircle, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Use NEXT_PUBLIC_APP_URL or fallback to window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectTo = `${baseUrl}/auth/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        console.error("[v0] Reset password error:", error)
        throw error
      }

      setIsSuccess(true)
    } catch (error: unknown) {
      console.error("[v0] Forgot password error:", error)
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">🥋</div>
            <span className="text-[11px] text-zinc-500 tracking-wide">by Simon Franco</span>
            <h1 className="text-2xl font-bold text-white mt-3">ABA Sensei</h1>
          </div>

          <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-white/60 text-sm mb-4">
                We&apos;ve sent a password reset link to <span className="text-amber-400">{email}</span>
              </p>
              <p className="text-white/40 text-xs mb-6">
                If you don&apos;t see it, check your spam folder.
              </p>
              <Link
                href="/auth/login"
                className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-4"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🥋</div>
          <span className="text-[11px] text-zinc-500 tracking-wide">by Simon Franco</span>
          <h1 className="text-2xl font-bold text-white mt-3">Reset your password</h1>
          <p className="text-white/60 mt-2 text-sm">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0a0a0f] border-white/20 text-white placeholder:text-white/40 pl-10"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/auth/login"
                className="text-white/60 hover:text-white/80 text-sm"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
