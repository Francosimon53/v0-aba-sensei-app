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
    if (selectedOption) return // Already answered
    setSelectedOption(optionId)
    setShowFeedback(true)
  }

  const handleNewQuestion = () => {
    setQuiz(null)
    setSelectedOption(null)
    setShowFeedback(false)
    setTopic("")
  }

  const getOptionButtonClass = (option: QuizOption) => {
    if (!selectedOption) {
      return "bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-700"
    }

    if (option.id === selectedOption) {
      return option.isCorrect
        ? "bg-green-50 border-2 border-green-500 text-green-800"
        : "bg-red-50 border-2 border-red-500 text-red-800"
    }

    if (option.isCorrect) {
      return "bg-green-50 border-2 border-green-500 text-green-800"
    }

    return "bg-slate-50 border-2 border-slate-200 text-slate-400"
  }

  const getOptionIcon = (option: QuizOption) => {
    if (!selectedOption) return null

    if (option.id === selectedOption) {
      return option.isCorrect ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )
    }

    if (option.isCorrect) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />
    }

    return null
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 border-green-300"
      case "Medium":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "Hard":
        return "bg-purple-100 text-purple-700 border-purple-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AI Tutor</h1>
              <p className="text-sm text-slate-500">Practice any topic with personalized questions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Topic Input */}
        {!quiz && !loading && (
          <Card className="bg-white border-slate-200 shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">What would you like to practice?</h2>
              <p className="text-slate-500">
                Enter any ABA topic and get a personalized practice question with detailed feedback
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="e.g., Partial Interval Recording, Functional Analysis, Reinforcement Schedules..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
                className="h-14 text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}

              <Button
                onClick={generateQuiz}
                disabled={!topic.trim()}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Question
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="bg-white border-slate-200 shadow-lg p-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 animate-pulse">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Generating your question...</h3>
                <p className="text-slate-500">Analyzing {topic} and creating a practice scenario</p>
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </Card>
        )}

        {/* Quiz Card */}
        {quiz && (
          <div className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-lg p-8">
              {/* Difficulty Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-slate-500 font-medium">Topic: {topic}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(quiz.difficulty)}`}
                >
                  {quiz.difficulty}
                </span>
              </div>

              {/* Question */}
              <div className="mb-8">
                <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-wrap">{quiz.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {quiz.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={!!selectedOption}
                    className={`w-full p-4 rounded-lg text-left transition-all duration-200 flex items-start gap-3 ${getOptionButtonClass(option)} ${!selectedOption ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className="font-bold text-base mt-0.5">{option.id}.</span>
                    <span className="flex-1 text-base">{option.text}</span>
                    {getOptionIcon(option)}
                  </button>
                ))}
              </div>

              {/* Feedback Section */}
              {showFeedback && (
                <div className="border-t-2 border-slate-200 pt-6 mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Rationale & Feedback
                  </h3>

                  {quiz.options.map((option) => {
                    const isSelected = option.id === selectedOption
                    const shouldShow = isSelected || option.isCorrect

                    if (!shouldShow) return null

                    return (
                      <div
                        key={option.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          option.isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {option.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          )}
                          <span className="font-semibold text-slate-800">
                            Option {option.id}: {option.isCorrect ? "Correct Answer" : "Your Selection"}
                          </span>
                        </div>
                        <p className="text-slate-700 ml-7">{option.rationale}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Next Action */}
            {showFeedback && (
              <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <Button
                  onClick={handleNewQuestion}
                  className="h-14 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg"
                >
                  Generate Another Question
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
