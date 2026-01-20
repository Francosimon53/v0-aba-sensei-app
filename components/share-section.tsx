"use client"

import { useState, useRef, useEffect } from "react"
import { AlertTriangle, BookOpen, Users, Copy, X } from "lucide-react"

interface ShareSectionProps {
  trapWord?: string
  trapExplanation?: string
  questionText?: string
  options?: Array<{ text: string }>
  detectedTraps?: Array<{ word: string; explanation: string }>
}

export function ShareSection({
  trapWord,
  trapExplanation,
  questionText,
  options,
  detectedTraps,
}: ShareSectionProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareOnX = (text: string) => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=https://abasensei.app`
    window.open(url, "_blank", "width=550,height=420")
  }

  const shareOnLinkedIn = (text: string) => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=https://abasensei.app&summary=${encodeURIComponent(text)}`
    window.open(url, "_blank", "width=750,height=600")
  }

  // Format share content for Trap Tip - Twitter optimized (under 280 chars)
  const trapTipContent = () => {
    if (!trapWord || !trapExplanation) return ""
    
    // Extract first sentence max 100 chars and create concise explanation
    const explanation = trapExplanation.split(".")[0].substring(0, 100)
    
    return `⚠️ EXAM TRAP: ${trapWord}

${explanation}

💡 Watch for this on your exam!

#BCBA #RBT #ABA
🎯 abasensei.app`
  }

  // Format share content for ABA Concept - Twitter optimized (under 280 chars)
  const abaConceptContent = () => {
    if (!detectedTraps || detectedTraps.length === 0) return ""
    const trap = detectedTraps[0]
    const shortExplanation = trap.explanation.split(".")[0].substring(0, 80)
    
    return `📚 ${trap.word}
❌ Common: Often confused
✅ ABA: ${shortExplanation}

#BCBA #RBT
🎯 abasensei.app`
  }

  // Format share content for Challenge a Friend - Twitter optimized (under 280 chars)
  const challengeFriendContent = () => {
    if (!questionText || !options) return ""
    const truncatedQuestion = questionText.substring(0, 120)
    
    return `🧠 BCBA Question:

${truncatedQuestion}...

Can you answer? 👇
abasensei.app

#BCBA #RBT`
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-zinc-500 text-xs uppercase tracking-wide font-medium">Share This</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Share Trap Tip */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "trap" ? null : "trap")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 transition-all duration-150 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Trap Tip</span>
          </button>

          {openDropdown === "trap" && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50 w-48">
              <button
                onClick={() => {
                  copyToClipboard(trapTipContent(), "trap")
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm text-zinc-300"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied === "trap" ? "Copied!" : "Copy to clipboard"}
              </button>
              <button
                onClick={() => {
                  shareOnX(trapTipContent())
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                Share on X/Twitter
              </button>
              <button
                onClick={() => {
                  shareOnLinkedIn(trapTipContent())
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                Share on LinkedIn
              </button>
            </div>
          )}
        </div>

        {/* Share ABA Concept */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "aba" ? null : "aba")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 transition-all duration-150 text-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ABA Term</span>
          </button>

          {openDropdown === "aba" && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50 w-48">
              <button
                onClick={() => {
                  copyToClipboard(abaConceptContent(), "aba")
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm text-zinc-300"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied === "aba" ? "Copied!" : "Copy to clipboard"}
              </button>
              <button
                onClick={() => {
                  shareOnX(abaConceptContent())
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                Share on X/Twitter
              </button>
              <button
                onClick={() => {
                  shareOnLinkedIn(abaConceptContent())
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                Share on LinkedIn
              </button>
            </div>
          )}
        </div>

        {/* Challenge a Friend */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "challenge" ? null : "challenge")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 transition-all duration-150 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Challenge</span>
          </button>

          {openDropdown === "challenge" && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50 w-48">
              <button
                onClick={() => {
                  copyToClipboard(challengeFriendContent(), "challenge")
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm text-zinc-300"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied === "challenge" ? "Copied!" : "Copy to clipboard"}
              </button>
              <button
                onClick={() => {
                  shareOnX(challengeFriendContent())
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                Share on X/Twitter
              </button>
              <button
                onClick={() => {
                  shareOnLinkedIn(challengeFriendContent())
                  setOpenDropdown(null)
                }}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                Share on LinkedIn
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
