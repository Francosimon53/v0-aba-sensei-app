"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Target, FileText, MessageCircle, Send, Bot, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Language, ExamType } from "@/types"

interface Message {
  id: number
  sender: "ai" | "user"
  content: string
  timestamp: Date
}

type TabMode = "drill" | "exam" | "tutor"

export default function SenseiModePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabMode>("drill")
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("BCBA")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load user preferences
  useEffect(() => {
    const savedLang = localStorage.getItem("aba_sensei_language") as Language
    const savedExam = localStorage.getItem("aba_sensei_exam_type") as ExamType
    if (savedLang) setLanguage(savedLang)
    if (savedExam) setExamType(savedExam)

    // Check auth
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
      }
    }
    checkAuth()
  }, [router])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: inputText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    const messageToSend = inputText
    setInputText("")
    setIsTyping(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          examLevel: examType.toLowerCase(),
          language: language,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      setIsTyping(false)

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: data.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setIsTyping(false)
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: "Sorry, I had trouble processing your message. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const tabs = [
    {
      id: "drill" as TabMode,
      name: "Drill",
      icon: Target,
      description: "Practice with immediate feedback",
    },
    {
      id: "exam" as TabMode,
      name: "Exam",
      icon: FileText,
      description: "Timed simulation mode",
    },
    {
      id: "tutor" as TabMode,
      name: "Tutor",
      icon: MessageCircle,
      description: "Chat with AI sensei",
    },
  ]

  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="border-b border-white/10 bg-black">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-white/60 hover:text-white/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-4xl">🥋</div>
            <div>
              <h1 className="font-bold text-white text-xl">ABA Sensei</h1>
              <p className="text-xs text-white/60">{examType} Preparation</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-amber-400">🔥 {streak}</div>
            <div className="text-purple-400">⭐ {xp} XP</div>
          </div>
        </div>

        <div className="flex border-t border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b-2 border-amber-500"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🥋</div>
            <h2 className="text-white text-xl font-bold mb-2">
              {activeTab === "drill" && "Ready to Drill?"}
              {activeTab === "exam" && "Exam Simulation Mode"}
              {activeTab === "tutor" && "Ask Me Anything"}
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              {activeTab === "drill" && "Practice questions with immediate feedback and trap detection"}
              {activeTab === "exam" && "10-20 timed questions. Results shown at the end."}
              {activeTab === "tutor" &&
                'Ask questions like "Explain extinction" or "What is the difference between MO and SD?"'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            {message.sender === "ai" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
                  <p className="text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            )}

            {message.sender === "user" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-2xl rounded-tr-md px-4 py-3 shadow-lg">
                  <p className="font-medium">{message.content}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-black" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg flex gap-1">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 bg-zinc-900 p-4">
        <div className="flex gap-2 max-w-[600px] mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={
              activeTab === "drill"
                ? "Ask for a practice question..."
                : activeTab === "exam"
                  ? "Start exam simulation..."
                  : "Ask me anything about ABA..."
            }
            className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black rounded-xl px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
