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
        return "bg-green-500/10 text-green-400/90 border-green-500/20"
      case "Hard":
        return "bg-red-500/10 text-red-400/90 border-red-500/20"
      default: // Medium
        return "bg-amber-500/10 text-amber-400/90 border-amber-500/20"
    }
  }

  // Welcome screen
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <header className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition-all duration-150">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-amber-500/90">
              <Flame className="w-4 h-4" />
              <span className="font-medium text-sm">{gameStats.streak}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400/80">
              <Zap className="w-4 h-4" />
              <span className="font-medium text-sm">{gameStats.xp}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Level toggle */}
          <div className="flex bg-zinc-900 rounded-full p-1 mb-8 border border-zinc-800">
            <button
              onClick={() => setExamLevel("rbt")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                examLevel === "rbt" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              RBT
            </button>
            <button
              onClick={() => setExamLevel("bcba")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                examLevel === "bcba" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              BCBA
            </button>
          </div>

          {/* Logo and title */}
          <div className="text-5xl mb-4 opacity-90">🥋</div>
          <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">Ready to practice?</h1>
          <p className="text-zinc-500 text-center mb-8">
            {gameStats.correctToday}/{gameStats.dailyGoal} questions today
          </p>

          {/* Progress ring */}
          <div className="relative w-32 h-32 mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#1f1f1f" strokeWidth="6" />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#d4a853"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 3.52} 352`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Target className="w-7 h-7 text-amber-500/80 mb-1" />
              <span className="text-white font-medium">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={startSession}
            className="w-full max-w-xs bg-[#b8942d] hover:bg-[#d4a853] text-black font-semibold py-6 text-base rounded-xl transition-all duration-150"
          >
            Start Practice
          </Button>

          {/* Daily goal card */}
          <div className="mt-8 bg-zinc-900/80 rounded-xl p-4 w-full max-w-xs border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500/80" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Daily Goal</p>
                  <p className="text-zinc-500 text-xs">
                    {gameStats.correctToday}/{gameStats.dailyGoal} correct
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSessionStarted(false)}
            className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition-all duration-150"
          >
            <X className="w-5 h-5 text-zinc-600" />
          </button>
          <span className="text-zinc-500 text-sm">{examLevel.toUpperCase()} Practice</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-500/90">
            <Flame className="w-4 h-4" />
            <span className="font-medium text-sm">{gameStats.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400/80 relative">
            <Zap className="w-4 h-4" />
            <span className="font-medium text-sm">{gameStats.xp}</span>
            {showXPAnimation && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-400 font-medium text-sm animate-bounce">
                +10
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL - Sensei Explanation */}
        <div className="w-full md:w-[320px] bg-black border-b md:border-b-0 md:border-r border-zinc-800/30 flex flex-col shrink-0">
          {/* Panel header */}
          <div className="p-4 border-b border-zinc-800/30">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-zinc-200 hover:text-white transition-all duration-150"
            >
              <span className="text-lg">🥋</span>
              <span className="font-medium text-[#d4a853]">ABA Sensei</span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-600 transition-transform duration-150 ${showReasoning ? "rotate-180" : ""}`}
              />
            </button>
            <p className="text-zinc-600 text-xs mt-1">{showReasoning ? "Reasoning" : "Hidden"}</p>
          </div>

          {/* Explanation content */}
          {showReasoning && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-amber-500/60 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : isAnswered && currentQuestion ? (
                <>
                  {/* Correct/Incorrect feedback */}
                  <div
                    className={`p-4 rounded-xl ${
                      currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <p
                      className={`font-medium text-sm ${
                        currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? "Correct!"
                        : "Not quite"}
                    </p>
                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                      {currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? currentQuestion.options.find((o) => o.isCorrect)?.rationale
                        : `The correct answer is ${currentQuestion.options.find((o) => o.isCorrect)?.id}. ${currentQuestion.options.find((o) => o.isCorrect)?.rationale}`}
                    </p>
                  </div>

                  {/* Definition section */}
                  {quickTip && (
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/30">
                      <p className="text-[#d4a853] font-medium text-xs mb-2 uppercase tracking-wide">Definition</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{quickTip}</p>
                    </div>
                  )}

                  {/* Trap Alert */}
                  {detectedTraps.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <p className="text-amber-400/90 font-medium text-xs mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <span>⚠</span> Trap Detected
                      </p>
                      {detectedTraps.map((trap, i) => (
                        <p key={i} className="text-zinc-400 text-sm leading-relaxed">
                          <span className="text-amber-300/80 font-medium">&quot;{trap.word}&quot;</span> -{" "}
                          {trap.explanation}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Why wrong */}
                  {!currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect && errorDiagnosis && (
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/30">
                      <p className="text-red-400/80 font-medium text-xs mb-2 uppercase tracking-wide">Why it's wrong</p>
                      <p className="text-zinc-400 text-sm leading-relaxed italic">{errorDiagnosis}</p>
                    </div>
                  )}

                  {/* Sensei response to follow-up question */}
                  {senseiResponse && (
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/30">
                      <p className="text-zinc-300 text-sm leading-relaxed">{senseiResponse}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-10 h-10 text-zinc-800 mb-3" />
                  <p className="text-zinc-600 text-sm">Answer the question to see reasoning</p>
                </div>
              )}
            </div>
          )}

          {/* Ask Sensei input */}
          <div className="p-3 border-t border-zinc-800/30 mt-auto">
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-800/50">
              <input
                ref={inputRef}
                type="text"
                value={senseiQuestion}
                onChange={(e) => setSenseiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskSensei()}
                placeholder="Ask the Sensei..."
                className="flex-1 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-600 outline-none"
                disabled={!isAnswered || isAskingSensei}
              />
              <button
                onClick={handleAskSensei}
                disabled={!isAnswered || isAskingSensei || !senseiQuestion.trim()}
                className="p-1 text-zinc-500 hover:text-[#d4a853] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isAskingSensei ? (
                  <div className="w-4 h-4 border-2 border-amber-500/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Quiz Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
          {/* Progress bar */}
          <div className="p-3 border-b border-zinc-800/30 shrink-0">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: gameStats.dailyGoal }).map((_, i) => {
                const historyItem = questionHistory[i]
                let bgColor = "bg-zinc-800"
                if (historyItem) {
                  bgColor = historyItem.isCorrect ? "bg-green-500/60" : "bg-red-500/60"
                } else if (i === currentQuestionNumber - 1) {
                  bgColor = "bg-zinc-500"
                }
                return <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${bgColor}`} />
              })}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {currentQuestionNumber} of {gameStats.dailyGoal}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-red-400/70 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {gameStats.questionsAnswered - gameStats.correctToday}
                </span>
                <span className="text-green-400/70 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {gameStats.correctToday}
                </span>
              </div>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 border-2 border-zinc-700 border-t-amber-500/60 rounded-full animate-spin mb-4" />
                <p className="text-zinc-600 text-sm">Loading question...</p>
              </div>
            ) : currentQuestion ? (
              <div className="max-w-[800px] mx-auto">
                {/* Difficulty badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyStyles(currentQuestion.difficulty)}`}
                  >
                    {currentQuestion.difficulty === "Easy"
                      ? "Easy"
                      : currentQuestion.difficulty === "Hard"
                        ? "Hard"
                        : "Medium"}
                  </span>
                </div>

                {/* Question text */}
                <div className="mb-4">
                  <p className="text-zinc-600 text-xs mb-1">{currentQuestionNumber}.</p>
                  <p className="text-white text-base leading-relaxed">{currentQuestion.content}</p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option.id
                    const isCorrect = option.isCorrect
                    const showResult = isAnswered

                    let cardStyles = "bg-zinc-900 border-zinc-800 hover:brightness-110"
                    if (showResult) {
                      if (isCorrect) {
                        cardStyles = "bg-green-500/10 border-green-500/40"
                      } else if (isSelected && !isCorrect) {
                        cardStyles = "bg-red-500/10 border-red-500/40"
                      } else {
                        cardStyles = "bg-zinc-900/30 border-zinc-800/30 opacity-40"
                      }
                    } else if (isSelected) {
                      cardStyles = "bg-zinc-900 border-[#d4a853]"
                    }

                    return (
                      <div key={option.id}>
                        <button
                          onClick={() => handleAnswer(option.id)}
                          disabled={isAnswered}
                          className={`w-full py-3 px-4 rounded-xl border text-left transition-all duration-150 hover:shadow-lg hover:shadow-black/20 ${cardStyles}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-150 ${
                                showResult && isCorrect
                                  ? "bg-green-500 text-black"
                                  : showResult && isSelected && !isCorrect
                                    ? "bg-red-500 text-white"
                                    : isSelected
                                      ? "bg-[#d4a853] text-black"
                                      : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {showResult && isCorrect ? (
                                <Check className="w-3 h-3" />
                              ) : showResult && isSelected && !isCorrect ? (
                                <X className="w-3 h-3" />
                              ) : (
                                option.id
                              )}
                            </span>
                            <span className="text-zinc-200 text-sm leading-relaxed">{option.text}</span>
                          </div>
                        </button>

                        {/* Inline feedback for wrong answer */}
                        {showResult && isSelected && !isCorrect && (
                          <div className="mt-2 ml-10 text-xs text-red-400/70">
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
                <p className="text-zinc-500 text-sm">Could not load question</p>
                <Button onClick={loadQuestion} className="mt-4 bg-[#b8942d] hover:bg-[#d4a853] text-black text-sm">
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="p-3 border-t border-zinc-800/30 shrink-0">
            <div className="flex items-center justify-between max-w-[800px] mx-auto gap-4">
              <Button
                onClick={handlePreviousQuestion}
                variant="ghost"
                className="px-4 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 bg-transparent transition-all duration-150"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className="px-4 py-2 bg-[#b8942d] hover:bg-[#d4a853] text-black font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
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
