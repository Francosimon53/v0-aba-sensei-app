"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export const categoryToDomain: Record<string, string> = {
  // BCBA 6th Edition (2025) categories
  "A. Behaviorism and Philosophical Foundations": "A",
  "B. Concepts and Principles": "B",
  "C. Measurement, Data Display, and Interpretation": "C",
  "D. Experimental Design": "D",
  "E. Ethical and Professional Issues": "E",
  "F. Behavior Assessment": "F",
  "G. Behavior-Change Procedures": "G",
  "H. Selecting and Implementing Interventions": "H",
  "I. Personnel Supervision and Management": "I",
  // RBT 3rd Edition (2026) categories
  "A. Data Collection and Graphing": "A",
  "B. Behavior Assessment": "B",
  "C. Behavior Acquisition": "C",
  "D. Behavior Reduction": "D",
  "E. Documentation and Reporting": "E",
  "F. Ethics": "F",
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.log("[v0] Auth check error (non-critical):", error.message)
          setIsLoading(false)
          return
        }

        if (user) {
          setIsLoggedIn(true)
          router.push("/dashboard")
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        console.log("[v0] Auth check failed (non-critical):", err)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🥋</div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥋</span>
              <span className="font-bold text-white text-xl">ABA Sensei</span>
            </div>
            <Link href="/about" className="text-xs text-zinc-400 hover:text-amber-500 transition ml-8">
              Built by Simon Franco, M.S. in Applied Behavior Analysis
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-zinc-400 hover:text-white transition hidden sm:inline">
              About
            </Link>
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
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <span className="text-amber-500 text-sm font-medium">AI-Powered Exam Prep</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Master your
            <br />
            <span className="text-amber-500">BCBA & RBT</span> exam
          </h1>

          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            <span className="inline-flex items-center px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400">
              BCBA <span className="text-amber-500 font-bold ml-1">6th Ed.</span>
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400">
              RBT <span className="text-amber-500 font-bold ml-1">3rd Ed.</span>
            </span>
          </div>

          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            The only ABA exam prep with a personal AI tutor that adapts to YOUR weak areas. Not just quizzes — real understanding.
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
      <section className="relative z-10 py-12 border-y border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-white">AI</p>
              <p className="text-zinc-500 text-sm mt-1">Adaptive Learning</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">Unlimited</p>
              <p className="text-zinc-500 text-sm mt-1">AI-Generated Questions</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">2</p>
              <p className="text-zinc-500 text-sm mt-1">Exams Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
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

      {/* See It In Action */}
      <section className="relative z-10 py-20 px-6 bg-zinc-950/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">See it in action</h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            AI Sensei explains the WHY behind every answer — not just right or wrong.
          </p>

          {/* App Mockup */}
          <div className="bg-[#0c0c11] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            {/* Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-[#0e0e14]">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-600 font-mono">ABA Sensei — Practice Session</span>
            </div>

            <div className="p-5 sm:p-8 space-y-5">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-500/80 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  BCBA 6th Ed. — Section G
                </span>
                <span className="text-xs text-zinc-600">Question 14 of 30</span>
              </div>

              {/* Question */}
              <p className="text-white font-medium leading-relaxed">
                A child receives a sticker each time they complete a math worksheet. Over the next two weeks, the child completes worksheets more frequently. This is an example of:
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 text-sm">
                  <span className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-xs shrink-0">A</span>
                  <span>Negative reinforcement</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xs text-red-400 shrink-0">B</span>
                  <span className="text-red-300">Positive punishment</span>
                  <span className="ml-auto text-red-400 text-xs shrink-0">&#x2717;</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/40 bg-green-500/5 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs text-green-400 shrink-0">C</span>
                  <span className="text-green-300">Positive reinforcement</span>
                  <span className="ml-auto text-green-400 text-xs shrink-0">&#x2713;</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 text-sm">
                  <span className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-xs shrink-0">D</span>
                  <span>Automatic reinforcement</span>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="border border-amber-500/20 bg-amber-500/[0.03] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🥋</span>
                  <span className="text-amber-500 font-semibold text-sm">AI Sensei</span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Not quite. Remember: <span className="text-amber-400 font-medium">positive reinforcement</span> means <span className="text-white font-medium">ADDING</span> a stimulus that <span className="text-white font-medium">INCREASES</span> behavior. In this scenario, the sticker (stimulus added) led to more worksheet completion (behavior increased). Positive punishment would involve adding an <em>aversive</em> stimulus to decrease behavior — the opposite of what happened here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 px-6 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* TEAM */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-white mb-2">Team</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <p className="text-blue-400 text-sm mb-6">For clinics & training</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-blue-500">✓</span> Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-blue-500">✓</span> Up to 10 members
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-blue-500">✓</span> Admin dashboard
                </li>
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-blue-500">✓</span> Team analytics
                </li>
              </ul>
              <Link
                href="/auth/sign-up?plan=team"
                className="block w-full text-center py-3 border border-zinc-700 rounded-xl text-white hover:bg-zinc-800 transition"
              >
                Get Team
              </Link>
            </div>
          </div>

          {/* Agency Plans */}
          <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-semibold">Custom Agency Plans</h4>
              <p className="text-zinc-400 text-sm">Need more than 10 team members? We offer custom enterprise solutions.</p>
            </div>
            <Link href="/contact" className="text-amber-500 hover:text-amber-400 font-medium whitespace-nowrap">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">🎓</div>
          <p className="text-2xl text-white mb-4 leading-relaxed">
            Join students preparing for their BCBA & RBT exams
          </p>
          <p className="text-zinc-400">
            AI-powered practice aligned with the latest BCBA 6th Edition and RBT 3rd Edition task lists.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-zinc-950 to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to pass your exam?</h2>
          <p className="text-xl text-zinc-400 mb-10">AI-powered exam prep for BCBA and RBT candidates.</p>
          <Link
            href="/auth/sign-up"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold px-10 py-4 rounded-full text-lg transition hover:scale-105"
          >
            Start Free Today
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently asked questions</h2>

          <div className="space-y-4">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel your subscription anytime from your account settings. No questions asked.",
              },
              {
                q: "Is the content updated for the latest edition?",
                a: "Yes. All BCBA questions align with the 6th Edition Task List, and RBT questions follow the 3rd Edition.",
              },
              {
                q: "How is ABA Sensei different from other study apps?",
                a: "Most apps give you static quizzes. ABA Sensei uses AI to adapt to your weak areas, explain concepts in depth, and simulate real exam conditions with personalized feedback.",
              },
              {
                q: "Does it work on mobile?",
                a: "Yes. ABA Sensei works on any device with a web browser.",
              },
              {
                q: "What if I don\u2019t pass?",
                a: "Use the analytics to identify weak areas and keep practicing. Our AI adapts to focus on what you need most.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-white font-medium hover:bg-zinc-800/50 transition list-none">
                  {faq.q}
                  <span className="text-zinc-500 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="px-6 pb-5 text-zinc-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥋</span>
              <span className="font-semibold text-white">ABA Sensei</span>
            </div>
            <Link href="/about" className="text-xs text-zinc-400 hover:text-amber-500 transition ml-7">
              Built by Simon Franco, M.S. in Applied Behavior Analysis
            </Link>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
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
          <p className="text-zinc-600 text-sm">© 2026 ABA Sensei. All rights reserved.</p>
        </div>

        {/* BACB Disclaimer */}
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-zinc-900">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            ABA Sensei is not affiliated with, endorsed by, or associated with the Behavior Analyst Certification Board (BACB). BCBA® and RBT® are registered trademarks of the BACB. This is an independent study tool and does not guarantee exam success.
          </p>
        </div>
      </footer>
    </div>
  )
}
