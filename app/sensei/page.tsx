"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, ArrowLeft, ChevronLeft, ChevronRight, BarChart2, Repeat, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Language, ExamType } from "@/types"

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  userAnswer?: number
  isCorrect?: boolean
}

interface QuizResults {
  score: number
  total: number
  timeElapsed: number
  strengths: string[]
  weaknesses: string[]
}

type TabMode = "drill" | "exam" | "tutor"

export default function SenseiModePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabMode>("drill")
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("BCBA")

  const [quizActive, setQuizActive] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)

  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isTyping])

  const startQuiz = async () => {
    setQuizActive(true)
    setCurrentQuestionIndex(0)
    setShowResults(false)
    setStartTime(new Date())

    // Generate mock questions for demo (replace with API call)
    const mockQuestions: QuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      question: `Sample question ${i + 1} about ABA concepts and principles. This would be fetched from the API.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: Math.floor(Math.random() * 4),
    }))
    setQuizQuestions(mockQuestions)
  }

  const handleAnswerSelect = (optionIndex: number) => {
    if (!quizActive || currentQuestionIndex >= quizQuestions.length) return

    const updatedQuestions = [...quizQuestions]
    updatedQuestions[currentQuestionIndex].userAnswer = optionIndex
    updatedQuestions[currentQuestionIndex].isCorrect =
      optionIndex === updatedQuestions[currentQuestionIndex].correctAnswer
    setQuizQuestions(updatedQuestions)

    // In drill mode, show immediate feedback
    if (activeTab === "drill") {
      setTimeout(() => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
          finishQuiz()
        }
      }, 1500)
    }
  }

  const finishQuiz = () => {
    const correctCount = quizQuestions.filter((q) => q.isCorrect).length
    const timeElapsed = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0

    setQuizResults({
      score: correctCount,
      total: quizQuestions.length,
      timeElapsed,
      strengths: ["Concepts & Principles", "Measurement"],
      weaknesses: ["Experimental Design"],
    })
    setShowResults(true)
    setQuizActive(false)
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    setChatMessages((prev) => [...prev, `User: ${inputText}`])
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
      setChatMessages((prev) => [...prev, `Sensei: ${data.message}`])
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setIsTyping(false)
      setChatMessages((prev) => [...prev, "Sensei: Sorry, I had trouble processing your message."])
    }
  }

  const currentQuestion = quizQuestions[currentQuestionIndex]

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* LEFT PANEL - Chat (30%) */}
      <div className="w-[30%] border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="border-b border-zinc-800 p-4">
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-zinc-200 transition-colors mb-3 flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="text-3xl">🥋</div>
            <div>
              <h1 className="font-bold text-white text-lg">ABA Sensei</h1>
              <p className="text-xs text-zinc-500">{examType} Prep</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs">
            <div className="text-amber-400">🔥 {streak}</div>
            <div className="text-purple-400">⭐ {xp} XP</div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">Ask me anything about ABA concepts</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.startsWith("User:") ? "text-zinc-300" : "text-zinc-400"}`}>
              {msg.replace("User: ", "").replace("Sensei: ", "")}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
              <div
                className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-zinc-800 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="What do you want to learn?"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              size="sm"
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Main Content (70%) */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-zinc-800 flex">
          {[
            { id: "drill", label: "Drill 🎯" },
            { id: "exam", label: "Exam 📝" },
            { id: "tutor", label: "Tutor 💬" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabMode)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "text-white border-b-2 border-amber-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!quizActive && !showResults && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="text-5xl mb-4">🥋</div>
                <h2 className="text-white text-2xl font-bold mb-3">
                  {activeTab === "drill" && "Ready to Drill?"}
                  {activeTab === "exam" && "Exam Simulation"}
                  {activeTab === "tutor" && "Interactive Learning"}
                </h2>
                <p className="text-zinc-400 mb-6 text-sm">
                  {activeTab === "drill" && "Practice with immediate feedback on each question"}
                  {activeTab === "exam" && "10 timed questions. Results shown at the end."}
                  {activeTab === "tutor" && "Chat with Sensei on the left to learn concepts"}
                </p>
                {(activeTab === "drill" || activeTab === "exam") && (
                  <Button
                    onClick={startQuiz}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-medium"
                  >
                    Start {activeTab === "drill" ? "Drill" : "Exam"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {quizActive && currentQuestion && (
            <div className="p-8 max-w-3xl mx-auto">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">
                    Question {currentQuestionIndex + 1} / {quizQuestions.length}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}%
                  </span>
                </div>
                <div className="flex gap-1">
                  {quizQuestions.map((q, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < currentQuestionIndex
                          ? q.isCorrect
                            ? "bg-green-500"
                            : "bg-red-500"
                          : i === currentQuestionIndex
                            ? "bg-amber-500"
                            : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentQuestion.userAnswer === index
                  const isCorrect = index === currentQuestion.correctAnswer
                  const showFeedback = isSelected && activeTab === "drill"

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={currentQuestion.userAnswer !== undefined}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        showFeedback
                          ? isCorrect
                            ? "bg-green-500/10 border-green-500 text-green-400"
                            : "bg-red-500/10 border-red-500 text-red-400"
                          : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"
                      }`}
                    >
                      <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="bg-zinc-900 border-zinc-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                {activeTab === "exam" && (
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex < quizQuestions.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1)
                      } else {
                        finishQuiz()
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      "Finish"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {showResults && quizResults && (
            <div className="p-8 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">{quizResults.score / quizResults.total >= 0.8 ? "🎉" : "💪"}</div>
                <h2 className="text-white text-3xl font-bold mb-2">Quiz Complete!</h2>
                <p className="text-zinc-400">
                  You scored {quizResults.score} out of {quizResults.total} (
                  {Math.round((quizResults.score / quizResults.total) * 100)}%)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {quizResults.score}/{quizResults.total}
                  </div>
                  <div className="text-xs text-zinc-500">Score</div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.floor(quizResults.timeElapsed / 60)}m {quizResults.timeElapsed % 60}s
                  </div>
                  <div className="text-xs text-zinc-500">Time</div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {Math.round((quizResults.score / quizResults.total) * 100)}%
                  </div>
                  <div className="text-xs text-zinc-500">Accuracy</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-900 rounded-lg p-4">
                  <h3 className="text-green-400 font-medium mb-2 text-sm">Strengths</h3>
                  <ul className="text-zinc-400 text-sm space-y-1">
                    {quizResults.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4">
                  <h3 className="text-amber-400 font-medium mb-2 text-sm">Areas to Review</h3>
                  <ul className="text-zinc-400 text-sm space-y-1">
                    {quizResults.weaknesses.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    /* TODO: Analyze performance */
                  }}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Analyze Performance
                </Button>
                <Button onClick={startQuiz} className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800">
                  <Repeat className="w-4 h-4 mr-2" />
                  More Questions
                </Button>
                <Button
                  onClick={() => {
                    /* TODO: Generate flashcards */
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Flashcards
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
