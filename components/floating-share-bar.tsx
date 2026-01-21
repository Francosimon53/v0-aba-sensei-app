"use client"

import { Share2, BookOpen, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FloatingShareBarProps {
  onShareTrapTip: () => void
  onShareAbaTerm: () => void
  onShareChallenge: () => void
  isVisible: boolean
}

export function FloatingShareBar({
  onShareTrapTip,
  onShareAbaTerm,
  onShareChallenge,
  isVisible,
}: FloatingShareBarProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex gap-2 bg-black/80 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-lg hover:bg-black/90 transition-all">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-8 w-8 p-0 hover:bg-white/10"
          onClick={onShareTrapTip}
          title="Share Trap Tip"
        >
          <Share2 className="w-4 h-4" />
          <span className="ml-1.5 hidden sm:inline text-xs">Trap</span>
        </Button>

        <div className="w-px bg-white/10" />

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-8 w-8 p-0 hover:bg-white/10"
          onClick={onShareAbaTerm}
          title="Share ABA Term"
        >
          <BookOpen className="w-4 h-4" />
          <span className="ml-1.5 hidden sm:inline text-xs">Term</span>
        </Button>

        <div className="w-px bg-white/10" />

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-8 w-8 p-0 hover:bg-white/10"
          onClick={onShareChallenge}
          title="Challenge a Friend"
        >
          <Users className="w-4 h-4" />
          <span className="ml-1.5 hidden sm:inline text-xs">Challenge</span>
        </Button>
      </div>
    </div>
  )
}
