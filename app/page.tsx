"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        router.push("/dashboard")
      } else {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  // Smooth scroll handler
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🥋</div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥋</span>
            <span className="font-bold text-white text-xl">ABA Sensei</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-zinc-400 hover:text-white transition">
              Login
            </Link>
            <Link
              href="/auth/sign-up"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-full transition"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <span className="text-amber-500 text-sm font-medium">AI-Powered Exam Prep</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Master your
            <br />
            <span className="text-amber-500">BCBA & RBT</span> exam
          </h1>

          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            The smartest way to prepare. AI-generated questions, instant feedback, and personalized tutoring to help you
            pass on your first try.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-4 rounded-full text-lg transition hover:scale-105"
            >
              Start Free Practice
            </Link>
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, "pricing")}
              className="text-zinc-400 hover:text-white font-medium px-6 py-4 transition cursor-pointer"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-white">95%</p>
              <p className="text-zinc-500 text-sm mt-1">Pass Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">10,000+</p>
              <p className="text-zinc-500 text-sm mt-1">Questions</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">4.9</p>
              <p className="text-zinc-500 text-sm mt-1">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Everything you need to pass</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition">
              <div className="text-4xl mb-4">🥋</div>
              <h3 className="text-xl font-bold text-white mb-2">AI Sensei</h3>
              <p className="text-zinc-400">Personalized AI tutor that adapts to your weak areas and learning style.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Practice</h3>
              <p className="text-zinc-400">Practice by category and difficulty. Focus on what matters most.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Exam Simulation</h3>
              <p className="text-zinc-400">Timed practice tests that mirror the real BCBA and RBT exams.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* FREE */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-white mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-zinc-500">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-500">✓</span> 5 questions per day
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-500">✓</span> 1 category access
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-500">✓</span> Basic explanations
                </li>
              </ul>
              <Link
                href="/auth/sign-up"
                className="block w-full text-center py-3 border border-zinc-700 rounded-xl text-white hover:bg-zinc-800 transition"
              >
                Get Started
              </Link>
            </div>

            {/* PRO - HIGHLIGHTED */}
            <div className="bg-gradient-to-b from-amber-500/10 to-transparent border-2 border-amber-500 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$19</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-300">
                  <span className="text-amber-500">✓</span> Unlimited questions
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <span className="text-amber-500">✓</span> All categories
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <span className="text-amber-500">✓</span> AI Sensei tutor
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <span className="text-amber-500">✓</span> Detailed analytics
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <span className="text-amber-500">✓</span> Exam simulations
                </li>
              </ul>
              <Link
                href="/auth/sign-up?plan=pro"
                className="block w-full text-center py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-black font-bold transition"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* ANNUAL */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-white mb-2">Pro Annual</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-white">$149</span>
                <span className="text-zinc-500">/year</span>
              </div>
              <p className="text-green-500 text-sm mb-6">Save $79 (2 months free)</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-500">✓</span> Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-500">✓</span> Priority support
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-500">✓</span> Early access features
                </li>
              </ul>
              <Link
                href="/auth/sign-up?plan=annual"
                className="block w-full text-center py-3 border border-zinc-700 rounded-xl text-white hover:bg-zinc-800 transition"
              >
                Get Annual
              </Link>
            </div>
          </div>

          {/* Team Plan Callout */}
          <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-semibold">Team & Agency Plans</h4>
              <p className="text-zinc-400 text-sm">Training multiple RBTs or BCBAs? Get volume pricing.</p>
            </div>
            <Link href="/contact" className="text-amber-500 hover:text-amber-400 font-medium whitespace-nowrap">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">"</div>
          <p className="text-2xl text-white mb-8 leading-relaxed">
            I passed my BCBA exam on the first try thanks to ABA Sensei. The AI tutor helped me understand concepts I'd
            been struggling with for months.
          </p>
          <div>
            <p className="text-white font-semibold">Sarah Johnson, BCBA</p>
            <p className="text-zinc-500">Passed BCBA Exam 2024</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-zinc-950 to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to pass your exam?</h2>
          <p className="text-xl text-zinc-400 mb-10">Join thousands of behavior analysts who passed with ABA Sensei.</p>
          <Link
            href="/auth/sign-up"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold px-10 py-4 rounded-full text-lg transition hover:scale-105"
          >
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥋</span>
            <span className="font-semibold text-white">ABA Sensei</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
          <p className="text-zinc-600 text-sm">© 2024 ABA Sensei. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
