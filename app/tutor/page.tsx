"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Flame,
  Trophy,
  Target,
  Check,
  X,
  Send,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

interface TrapWord {
  word: string
  type: "sequence" | "comparison" | "absolute" | "aba_terminology"
  explanation?: string
  commonMeaning?: string
  abaMeaning?: string
}

// Added TrapAnalysis interface
interface TrapAnalysis {
  hasTrap: boolean
  trapType: "terminology" | "conceptual" | "structure" | null
  trapWord: string | null
  trapExplanation: string | null
  quickTip: string
  commonConfusion: string | null
}

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
}

interface Flashcard {
  front: string
  back: string
}

interface FollowUpCard {
  id: string
  title: string
  description: string
  iconType: "flashcards_purple" | "guide_green" | "quiz_blue" | "more_orange"
}

interface FollowUpActions {
  title: string
  cards: FollowUpCard[]
  buttons: Array<{ id: string; text: string; primary?: boolean }>
}

interface ChatMessage {
  id: number
  sender: "ai" | "user"
  type: "text" | "quiz_question" | "flashcards" | "topic_input"
  content: string
  options?: QuizOption[]
  flashcards?: Flashcard[]
  userSelectedOptionId?: string | null
  isAnswered?: boolean
  difficulty?: "Easy" | "Medium" | "Hard"
  followUpActions?: FollowUpActions
  flippedCards?: Set<number>
  trapWords?: TrapWord[]
  highlightWords?: string[]
  trapAnalysis?: TrapAnalysis
}

interface GameStats {
  streak: number
  xp: number
  questionsAnswered: number
  correctToday: number
  dailyGoal: number
}

interface QuestionHistory {
  questionNumber: number
  isCorrect: boolean | null // null = unanswered
}

const RBT_CATEGORIES = [
  "Measurement",
  "Assessment",
  "Skill Acquisition",
  "Behavior Reduction",
  "Documentation",
  "Professional Conduct",
]

const BCBA_CATEGORIES = [
  "A - Philosophical Underpinnings",
  "B - Concepts and Principles",
  "C - Measurement, Data Display & Interpretation",
  "D - Experimental Design",
  "E - Ethics and Professional Conduct",
  "F - Behavior Assessment",
  "G - Behavior-Change Procedures",
  "H - Selecting and Implementing Interventions",
  "I - Personnel Supervision and Management",
]

interface TrapInfo {
  word: string
  type: "sequence" | "comparison" | "absolute" | string
  explanation: string
}

// Removed CollapsibleSection function as it is no longer used.

// Removed HighlightedQuestion function as it is no longer used.

export default function AITutorPage() {
  const [examLevel, setExamLevel] = useState<"bcba" | "rbt">("bcba")
  const [gameStats, setGameStats] = useState<GameStats>({
    streak: 3,
    xp: 150,
    questionsAnswered: 0,
    correctToday: 0,
    dailyGoal: 10, // Increased daily goal
  })
  const [currentQuestion, setCurrentQuestion] = useState<{
    content: string
    options: QuizOption[]
    difficulty: string
    trapAnalysis?: TrapAnalysis // Added trapAnalysis to currentQuestion
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false) // This state is no longer used
  const [showTrapAlert, setShowTrapAlert] = useState(false) // This state is no longer used
  const [showQuickTip, setShowQuickTip] = useState(false) // This state is no longer used
  const [showWhyWrong, setShowWhyWrong] = useState(false) // This state is no longer used
  const [detectedTraps, setDetectedTraps] = useState<TrapInfo[]>([])
  const [quickTip, setQuickTip] = useState<string>("")
  const [errorDiagnosis, setErrorDiagnosis] = useState<string>("")
  const [sessionStarted, setSessionStarted] = useState(false)
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]) // Added question history
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1) // Added current question number
  const [showReasoning, setShowReasoning] = useState(true) // State to toggle reasoning panel
  const [senseiQuestion, setSenseiQuestion] = useState("") // Input for asking the sensei
  const [senseiResponse, setSenseiResponse] = useState<string | null>(null) // Response from the sensei
  const [isAskingSensei, setIsAskingSensei] = useState(false) // Loading state for sensei response
  const messagesEndRef = useRef<HTMLDivElement>(null) // This ref is no longer used
  const inputRef = useRef<HTMLInputElement>(null) // Ref for sensei input
  const [messages, setMessages] = useState<ChatMessage[]>([]) // This state is no longer used
  const [inputText, setInputText] = useState("") // This state is no longer used
  const [isTyping, setIsTyping] = useState(false) // This state is no longer used
  const [waitingForTopic, setWaitingForTopic] = useState(false) // This state is no longer used
  const [currentTopic, setCurrentTopic] = useState<string>("") // This state is no longer used
  const progressPercent = 80 // Declare progressPercent variable

  // Removed callChatAPI function as it is no longer used.

  // Removed loadQuestion function as it is replaced by a new one.

  function generateQuickTip(trapAnalysis?: TrapAnalysis, correctOption?: QuizOption): string {
    // Prefer AI-generated tip if available
    if (trapAnalysis?.quickTip) return trapAnalysis.quickTip

    if (!correctOption) return ""
    const text = correctOption.text.toLowerCase()

    // Fallback to simple heuristics
    if (text.includes("generality")) return "Generality = behavior transfers across time, settings, and people"
    if (text.includes("effectiveness")) return "Effectiveness = Does it actually WORK to change behavior?"
    if (text.includes("applied")) return "Applied = Is it socially significant to the client?"
    if (text.includes("technological")) return "Technological = Can another person replicate it exactly?"
    if (text.includes("extinction")) return "Extinction = Stop the reinforcement, behavior decreases"
    if (text.includes("reinforcement")) return "Reinforcement = Behavior INCREASES after consequence"
    if (text.includes("punishment")) return "Punishment = Behavior DECREASES after consequence"

    return correctOption.rationale?.split(".")[0] || "Review this concept in your study materials"
  }

  function diagnoseError(
    selectedOption: QuizOption | undefined,
    correctOption: QuizOption | undefined,
    trapAnalysis?: TrapAnalysis,
  ): string {
    // Prefer AI-generated confusion analysis
    if (trapAnalysis?.commonConfusion) {
      return trapAnalysis.commonConfusion
    }

    if (!selectedOption || !correctOption) return ""

    const selectedText = selectedOption.text.toLowerCase()
    const correctText = correctOption.text.toLowerCase()

    // Fallback heuristics
    if (
      (selectedText.includes("positive") && correctText.includes("negative")) ||
      (selectedText.includes("negative") && correctText.includes("positive"))
    ) {
      return "VOCABULARY: You confused positive (add) with negative (remove)"
    }
    if (
      (selectedText.includes("reinforcement") && correctText.includes("punishment")) ||
      (selectedText.includes("punishment") && correctText.includes("reinforcement"))
    ) {
      return "CONCEPT: Reinforcement increases behavior, punishment decreases it"
    }
    if (selectedText.includes("extinction") || correctText.includes("extinction")) {
      return "CONCEPT: Extinction = withholding reinforcement, not adding punishment"
    }

    return "APPLICATION: The concept was correct, but applied to the wrong scenario"
  }

  const loadQuestion = async () => {
    setIsLoading(true)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setSenseiResponse(null) // Clear previous sensei response
    setDetectedTraps([]) // Clear previous traps
    setQuickTip("") // Clear previous quick tip
    setErrorDiagnosis("") // Clear previous error diagnosis

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "practice",
          topic: examLevel === "rbt" ? "RBT exam concepts" : "BCBA exam concepts",
          examLevel,
        }),
      })

      const data = await response.json()

      if (data.type === "quiz" && data.question) {
        const normalizedOptions: QuizOption[] = (data.options || []).map((opt: any, index: number) => {
          const letters = ["A", "B", "C", "D"]
          return {
            id: opt.id || letters[index],
            text: opt.text || opt.answer || opt.content || `Option ${letters[index]}`,
            isCorrect: opt.isCorrect === true || opt.correct === true,
            rationale: opt.rationale || opt.explanation || "",
          }
        })

        setCurrentQuestion({
          content: data.question,
          options: normalizedOptions,
          difficulty: data.difficulty || "Medium",
          trapAnalysis: data.trapAnalysis || null, // Include trapAnalysis
        })
      }
    } catch (error) {
      console.error("Error loading question:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Deleted lines 266-288

  const handleAnswer = (optionId: string) => {
    if (isAnswered) return

    setSelectedAnswer(optionId)
    setIsAnswered(true)
    // Removed setShowTrapAlert, setShowQuickTip, setShowWhyWrong, setShowLearnMore

    const selectedOption = currentQuestion?.options.find((o) => o.id === optionId)
    const correctOption = currentQuestion?.options.find((o) => o.isCorrect)
    const isCorrect = selectedOption?.isCorrect

    if (currentQuestion) {
      const trapAnalysis = currentQuestion.trapAnalysis // Assuming trapAnalysis is available on currentQuestion
      setDetectedTraps(
        trapAnalysis?.hasTrap
          ? [{ word: trapAnalysis.trapWord!, type: trapAnalysis.trapType!, explanation: trapAnalysis.trapExplanation! }]
          : [],
      ) // This might need adjustment based on how trapAnalysis is structured
      setQuickTip(generateQuickTip(trapAnalysis, correctOption))
      if (!isCorrect) {
        setErrorDiagnosis(diagnoseError(selectedOption, correctOption, trapAnalysis))
      }
    }

    // Update question history
    setQuestionHistory((prev) => [...prev, { questionNumber: currentQuestionNumber, isCorrect: isCorrect || false }])

    setGameStats((prev) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctToday: isCorrect ? prev.correctToday + 1 : prev.correctToday,
      xp: isCorrect ? prev.xp + 10 : prev.xp,
      streak: isCorrect ? prev.streak + 1 : 0,
    }))

    if (isCorrect) {
      setShowXPAnimation(true)
      setTimeout(() => setShowXPAnimation(false), 1500)
    }
  }

  const handleNextQuestion = () => {
    setCurrentQuestionNumber((prev) => prev + 1)
    loadQuestion()
  }

  const handlePreviousQuestion = () => {
    // For now, just go back to welcome screen
    setSessionStarted(false)
  }

  const handleAskSensei = async () => {
    if (!senseiQuestion.trim() || !currentQuestion) return

    setIsAskingSensei(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: `Regarding this question: "${currentQuestion.content}" - ${senseiQuestion}`,
          examLevel,
        }),
      })
      const data = await response.json()
      setSenseiResponse(data.content || "I couldn't process that question. Please try again.")
    } catch (error) {
      setSenseiResponse("Sorry, I had trouble answering. Please try again.")
    } finally {
      setIsAskingSensei(false)
      setSenseiQuestion("")
    }
  }

  const startSession = () => {
    setSessionStarted(true)
    setQuestionHistory([]) // Reset question history
    setCurrentQuestionNumber(1) // Reset question number
    loadQuestion() // Load first question when session starts
  }

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "Hard":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default: // Medium
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    }
  }

  // Welcome screen
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header */}
        <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-amber-500">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{gameStats.streak}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <Zap className="w-5 h-5" />
              <span className="font-bold">{gameStats.xp}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Level toggle */}
          <div className="flex bg-slate-800 rounded-full p-1 mb-8">
            <button
              onClick={() => setExamLevel("rbt")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                examLevel === "rbt" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              RBT
            </button>
            <button
              onClick={() => setExamLevel("bcba")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                examLevel === "bcba" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
              }`}
            >
              BCBA
            </button>
          </div>

          {/* Logo and title */}
          <div className="text-6xl mb-4">🥋</div>
          <h1 className="text-2xl font-bold text-white mb-2">Ready to practice?</h1>
          <p className="text-slate-400 text-center mb-8">
            {gameStats.correctToday}/{gameStats.dailyGoal} questions today
          </p>

          {/* Progress ring */}
          <div className="relative w-32 h-32 mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 3.52} 352`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Target className="w-8 h-8 text-amber-500 mb-1" />
              <span className="text-white font-bold">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={startSession}
            className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 text-black font-bold py-6 text-lg rounded-2xl"
          >
            Start Practice
          </Button>

          {/* Daily goal card */}
          <div className="mt-8 bg-slate-900 rounded-2xl p-4 w-full max-w-xs border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-white font-medium">Daily Goal</p>
                  <p className="text-slate-500 text-sm">
                    {gameStats.correctToday}/{gameStats.dailyGoal} correct
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setSessionStarted(false)} className="p-2 -ml-2 hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <span className="text-slate-400 text-sm font-medium">{examLevel.toUpperCase()} Practice</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-amber-500">
            <Flame className="w-5 h-5" />
            <span className="font-bold">{gameStats.streak}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 relative">
            <Zap className="w-5 h-5" />
            <span className="font-bold">{gameStats.xp}</span>
            {showXPAnimation && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-emerald-400 font-bold animate-bounce">
                +10
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL - Sensei Explanation */}
        <div className="w-full md:w-[35%] bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          {/* Panel header */}
          <div className="p-4 border-b border-slate-800">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-slate-200 hover:text-white transition"
            >
              <span className="text-xl">🥋</span>
              <span className="font-semibold">ABA Sensei</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${showReasoning ? "rotate-180" : ""}`} />
            </button>
            <p className="text-slate-500 text-sm mt-1">{showReasoning ? "Show Reasoning" : "Hide Reasoning"}</p>
          </div>

          {/* Explanation content */}
          {showReasoning && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : isAnswered && currentQuestion ? (
                <>
                  {/* Correct/Incorrect feedback */}
                  <div
                    className={`p-4 rounded-xl ${
                      currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "bg-red-500/10 border border-red-500/30"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? "Correct!"
                        : "Not quite"}
                    </p>
                    <p className="text-slate-300 text-sm mt-2">
                      {currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? currentQuestion.options.find((o) => o.isCorrect)?.rationale
                        : `The correct answer is ${currentQuestion.options.find((o) => o.isCorrect)?.id}. ${currentQuestion.options.find((o) => o.isCorrect)?.rationale}`}
                    </p>
                  </div>

                  {/* Definition section */}
                  {quickTip && (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-amber-400 font-medium text-sm mb-2">Definition:</p>
                      <p className="text-slate-300 text-sm">{quickTip}</p>
                    </div>
                  )}

                  {/* Trap Alert */}
                  {detectedTraps.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <p className="text-yellow-400 font-medium text-sm mb-2 flex items-center gap-2">
                        <span>🚨</span> Trap Detected
                      </p>
                      {detectedTraps.map((trap, i) => (
                        <p key={i} className="text-slate-300 text-sm">
                          <span className="text-yellow-300 font-semibold">&quot;{trap.word}&quot;</span> -{" "}
                          {trap.explanation}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Why wrong */}
                  {!currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect && errorDiagnosis && (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-red-400 font-medium text-sm mb-2">Why it's wrong:</p>
                      <p className="text-slate-300 text-sm italic">{errorDiagnosis}</p>
                    </div>
                  )}

                  {/* Sensei response to follow-up question */}
                  {senseiResponse && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <p className="text-slate-300 text-sm">{senseiResponse}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">Answer the question to see the Sensei's explanation</p>
                </div>
              )}
            </div>
          )}

          {/* Ask Sensei input */}
          <div className="p-4 border-t border-slate-800 mt-auto">
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2">
              <input
                ref={inputRef}
                type="text"
                value={senseiQuestion}
                onChange={(e) => setSenseiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskSensei()}
                placeholder="Ask the Sensei..."
                className="flex-1 bg-transparent text-slate-200 text-sm placeholder:text-slate-500 outline-none"
                disabled={!isAnswered || isAskingSensei}
              />
              <button
                onClick={handleAskSensei}
                disabled={!isAnswered || isAskingSensei || !senseiQuestion.trim()}
                className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isAskingSensei ? (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Quiz Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress bar */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: gameStats.dailyGoal }).map((_, i) => {
                  const historyItem = questionHistory[i]
                  let bgColor = "bg-slate-700"
                  if (historyItem) {
                    bgColor = historyItem.isCorrect ? "bg-emerald-500" : "bg-red-500"
                  } else if (i === currentQuestionNumber - 1) {
                    bgColor = "bg-amber-500"
                  }
                  return <div key={i} className={`h-2 flex-1 rounded-full transition-all ${bgColor}`} />
                })}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {currentQuestionNumber} of {gameStats.dailyGoal}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-red-400 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {gameStats.questionsAnswered - gameStats.correctToday}
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {gameStats.correctToday}
                </span>
              </div>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400">Loading question...</p>
              </div>
            ) : currentQuestion ? (
              <div className="max-w-2xl mx-auto">
                {/* Difficulty badge and question number */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyStyles(currentQuestion.difficulty)}`}
                  >
                    {currentQuestion.difficulty === "Easy"
                      ? "Easy"
                      : currentQuestion.difficulty === "Hard"
                        ? "Hard"
                        : "Medium"}
                  </span>
                </div>

                {/* Question text */}
                <div className="mb-6">
                  <p className="text-slate-400 text-sm mb-2">{currentQuestionNumber}.</p>
                  <p className="text-white text-lg leading-relaxed">{currentQuestion.content}</p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option.id
                    const isCorrect = option.isCorrect
                    const showResult = isAnswered

                    let cardStyles = "bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                    if (showResult) {
                      if (isCorrect) {
                        cardStyles = "bg-emerald-500/10 border-emerald-500"
                      } else if (isSelected && !isCorrect) {
                        cardStyles = "bg-red-500/10 border-red-500"
                      } else {
                        cardStyles = "bg-slate-800/30 border-slate-700/50 opacity-50"
                      }
                    } else if (isSelected) {
                      cardStyles = "bg-amber-500/10 border-amber-500"
                    }

                    return (
                      <div key={option.id}>
                        <button
                          onClick={() => handleAnswer(option.id)}
                          disabled={isAnswered}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${cardStyles}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                showResult && isCorrect
                                  ? "bg-emerald-500 text-black"
                                  : showResult && isSelected && !isCorrect
                                    ? "bg-red-500 text-white"
                                    : isSelected
                                      ? "bg-amber-500 text-black"
                                      : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {showResult && isCorrect ? (
                                <Check className="w-4 h-4" />
                              ) : showResult && isSelected && !isCorrect ? (
                                <X className="w-4 h-4" />
                              ) : (
                                option.id
                              )}
                            </span>
                            <span className="text-slate-200 pt-1">{option.text}</span>
                          </div>
                        </button>

                        {/* Inline feedback for wrong answer */}
                        {showResult && isSelected && !isCorrect && (
                          <div className="mt-2 ml-11 text-sm text-red-400/80">
                            <span className="font-medium">Not quite</span> - {option.rationale || errorDiagnosis}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-slate-400">Could not load question</p>
                <Button onClick={loadQuestion} className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between max-w-2xl mx-auto gap-4">
              <Button
                onClick={handlePreviousQuestion}
                variant="outline"
                className="px-6 py-5 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className="px-8 py-5 bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
