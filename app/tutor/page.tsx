"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight, BookOpen } from "lucide-react"

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
}

interface Quiz {
  question: string
  difficulty: "Easy" | "Medium" | "Hard"
  topic: string
  options: QuizOption[]
}

export default function AITutorPage() {
  const [topic, setTopic] = useState("")
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }

    setLoading(true)
    setError(null)
    setQuiz(null)
    setSelectedOption(null)
    setShowFeedback(false)

    try {
      const response = await fetch("/api/generate-topic-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate quiz")
      }

      const data = await response.json()
      setQuiz(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (optionId: string) => {
    if (selectedOption) return
    setSelectedOption(optionId)
    setTimeout(() => setShowFeedback(true), 300)
  }

  const handleNewQuestion = () => {
    setQuiz(null)
    setSelectedOption(null)
    setShowFeedback(false)
    setError(null)
  }

  const getOptionButtonClass = (option: QuizOption) => {
    if (!selectedOption) {
      return "bg-white hover:bg-slate-50/50 border-2 border-slate-200 hover:border-sky-400 hover:shadow-md text-slate-700 transition-all"
    }

    if (option.id === selectedOption) {
      return option.isCorrect
        ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-lg"
        : "bg-rose-50 border-2 border-rose-500 text-rose-900 shadow-lg"
    }

    if (option.isCorrect) {
      return "bg-emerald-50 border-2 border-emerald-500 text-emerald-900 shadow-md"
    }

    return "bg-slate-50/30 border-2 border-slate-200 text-slate-400 opacity-60"
  }

  const getOptionIcon = (option: QuizOption) => {
    if (!selectedOption) return null

    if (option.id === selectedOption) {
      return option.isCorrect ? (
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
      ) : (
        <XCircle className="w-6 h-6 text-rose-600" />
      )
    }

    if (option.isCorrect) {
      return <CheckCircle2 className="w-6 h-6 text-emerald-600" />
    }

    return null
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-50 text-emerald-700 border-emerald-300"
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-400"
      case "Hard":
        return "bg-rose-50 text-rose-700 border-rose-400"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-white">
      {/* Header - Clinical/Medical aesthetic */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">BCBA Exam Prep</h1>
              <p className="text-sm text-slate-500">Interactive Quiz & Study Assistant</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Topic Selector (Start Screen) */}
        {!quiz && !loading && (
          <Card className="bg-white border-slate-200 shadow-xl p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 mb-6 shadow-inner">
                <BookOpen className="w-10 h-10 text-sky-700" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">What topic do you want to practice?</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                Enter any ABA concept and receive a comprehensive practice question with detailed feedback
              </p>
            </div>

            <div className="space-y-5">
              <Input
                type="text"
                placeholder="e.g., Partial Interval, Ethics, Functional Analysis..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
                className="h-16 text-lg border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-xl shadow-sm"
              />

              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-400 p-4 rounded-lg">
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <Button
                onClick={generateQuiz}
                disabled={!topic.trim()}
                className="w-full h-16 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Question
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State - Sophisticated skeleton/thinking animation */}
        {loading && (
          <Card className="bg-white border-slate-200 shadow-xl p-14">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 animate-pulse shadow-lg">
                <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-700">Thinking...</h3>
                <p className="text-slate-500 text-lg">Generating your {topic} practice question</p>
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </Card>
        )}

        {/* Question Interface (Active State) */}
        {quiz && (
          <div className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-xl p-8 sm:p-10">
              {/* Topic and Difficulty Badge */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Topic:</span>
                  <span className="text-sm font-semibold text-slate-700">{quiz.topic}</span>
                </div>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${getDifficultyColor(quiz.difficulty)} shadow-sm`}
                >
                  {quiz.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <div className="mb-10">
                <p className="text-xl text-slate-800 leading-relaxed font-medium">{quiz.question}</p>
              </div>

              {/* Answer Options - Large, clickable cards */}
              <div className="space-y-4 mb-8">
                {quiz.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={!!selectedOption}
                    className={`w-full p-5 rounded-xl text-left flex items-start gap-4 ${getOptionButtonClass(option)} ${!selectedOption ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
                  >
                    <span className="font-bold text-lg mt-0.5 min-w-[24px]">{option.id}.</span>
                    <span className="flex-1 text-lg leading-relaxed">{option.text}</span>
                    <div className="mt-0.5">{getOptionIcon(option)}</div>
                  </button>
                ))}
              </div>

              {/* Rationale Section - Slides down/fades in after answering */}
              {showFeedback && (
                <div className="border-t-2 border-slate-200 pt-8 mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100">
                      <BookOpen className="w-5 h-5 text-sky-700" />
                    </div>
                    Rationale & Explanation
                  </h3>

                  {quiz.options.map((option) => {
                    const isSelected = option.id === selectedOption
                    const shouldShow = isSelected || option.isCorrect

                    if (!shouldShow) return null

                    return (
                      <div
                        key={option.id}
                        className={`p-5 rounded-xl border-l-4 shadow-md ${
                          option.isCorrect ? "bg-emerald-50 border-emerald-500" : "bg-rose-50 border-rose-500"
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {option.isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                          ) : (
                            <XCircle className="w-6 h-6 text-rose-600 mt-0.5" />
                          )}
                          <span className="font-bold text-slate-800 text-lg">
                            Option {option.id}: {option.isCorrect ? "Correct Answer" : "Your Selection"}
                          </span>
                        </div>
                        <p className="text-slate-700 ml-9 text-base leading-relaxed">{option.rationale}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Next Question Button */}
            {showFeedback && (
              <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <Button
                  onClick={handleNewQuestion}
                  className="h-16 px-10 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-all rounded-xl"
                >
                  Next Question
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
