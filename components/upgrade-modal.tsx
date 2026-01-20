"use client"

import { Lock, X, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  questionsUsed?: number
  maxQuestions?: number
}

export function UpgradeModal({ isOpen, onClose, questionsUsed = 5, maxQuestions = 5 }: UpgradeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Daily Limit Reached
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            You've used all {maxQuestions} free questions for today. 
            Upgrade to Pro for unlimited practice and accelerate your exam prep!
          </p>
        </div>

        {/* Progress indicator */}
        <div className="bg-zinc-800/50 rounded-lg p-3 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Questions used today</span>
            <span className="text-amber-500 font-medium">{questionsUsed}/{maxQuestions}</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(questionsUsed / maxQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Pro benefits */}
        <div className="bg-zinc-800/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-white">Pro includes:</span>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unlimited practice questions
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              AI Sensei tutor access
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Detailed analytics & insights
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/pricing")}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
          >
            Upgrade to Pro
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
          >
            Come Back Tomorrow
          </button>
        </div>
      </div>
    </div>
  )
}
