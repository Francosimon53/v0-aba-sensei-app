import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <span className="text-2xl">🥋</span>
            <span className="font-semibold">ABA Sensei</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Built by someone who lives ABA
          </h1>
        </div>

        {/* Story */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-zinc-300 leading-relaxed mb-6">
              ABA Sensei was built by Simon Franco, who holds a Master&apos;s degree in Applied Behavior Analysis.
            </p>
            <p className="text-lg text-zinc-300 leading-relaxed mb-6">
              After years of working in ABA — running agency operations, training RBTs, and preparing for the BCBA exam — Simon saw that existing study tools were static flashcards that don&apos;t adapt to how you actually learn.
            </p>
            <p className="text-lg text-zinc-300 leading-relaxed mb-6">
              So he built ABA Sensei: an AI-powered tutor that identifies your weak areas and adapts to your learning style.
            </p>
            <p className="text-xl text-white font-semibold leading-relaxed">
              This isn&apos;t another quiz app. It&apos;s the exam coach Simon wished he had.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/auth/sign-up"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-4 rounded-full text-lg transition hover:scale-105"
          >
            Start Free Practice
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-zinc-900 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥋</span>
              <span className="font-semibold text-white">ABA Sensei</span>
            </div>
            <span className="text-[10px] text-zinc-500 tracking-wide ml-7">by Simon Franco</span>
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
          <p className="text-zinc-600 text-sm">&copy; 2026 ABA Sensei. All rights reserved.</p>
        </div>

        {/* BACB Disclaimer */}
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-zinc-900">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            ABA Sensei is not affiliated with, endorsed by, or associated with the Behavior Analyst Certification Board (BACB). BCBA&reg; and RBT&reg; are registered trademarks of the BACB. This is an independent study tool and does not guarantee exam success.
          </p>
        </div>
      </footer>
    </div>
  )
}
