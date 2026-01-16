"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  BookOpen,
  Brain,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Flame,
  Trophy,
  Target,
  Check,
  X,
} from "lucide-react"
import Link from "next/link"

interface TrapWord {
  word: string
  type: "sequence" | "comparison" | "absolute" | "aba_terminology"
  explanation?: string
  commonMeaning?: string
  abaMeaning?: string
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
}

interface GameStats {
  streak: number
  xp: number
  questionsAnswered: number
  correctToday: number
  dailyGoal: number
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
  type: "sequence" | "comparison" | "absolute"
  explanation: string
}

function CollapsibleSection({
  title,
  icon,
  iconColor,
  bgColor,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: React.ReactNode
  iconColor: string
  bgColor: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`${bgColor} rounded-xl border border-slate-700 overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <span className="font-semibold text-slate-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-2 border-t border-slate-700">{children}</div>}
    </div>
  )
}

function HighlightedQuestion({ text, highlightWords = [] }: { text: string; highlightWords?: string[] }) {
  if (!highlightWords || highlightWords.length === 0) {
    return <span>{text}</span>
  }

  // Create regex pattern for all highlight words
  const pattern = new RegExp(`\\b(${highlightWords.join("|")})\\b`, "gi")
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = highlightWords.some((w) => w.toLowerCase() === part.toLowerCase())
        if (isHighlight) {
          return (
            <span key={index} className="bg-yellow-500/30 text-yellow-300 px-1 rounded font-semibold">
              {part}
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

export default function AITutorPage() {
  const [examLevel, setExamLevel] = useState<"bcba" | "rbt">("bcba")
  const [gameStats, setGameStats] = useState<GameStats>({
    streak: 3,
    xp: 150,
    questionsAnswered: 0,
    correctToday: 0,
    dailyGoal: 5,
  })
  const [currentQuestion, setCurrentQuestion] = useState<{
    content: string
    options: QuizOption[]
    difficulty: string
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [showTrapAlert, setShowTrapAlert] = useState(false)
  const [showQuickTip, setShowQuickTip] = useState(false)
  const [showWhyWrong, setShowWhyWrong] = useState(false)
  const [detectedTraps, setDetectedTraps] = useState<TrapInfo[]>([])
  const [quickTip, setQuickTip] = useState<string>("")
  const [errorDiagnosis, setErrorDiagnosis] = useState<string>("")
  const [sessionStarted, setSessionStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [waitingForTopic, setWaitingForTopic] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<string>("")

  const callChatAPI = async (action: string, topic?: string, message?: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        topic: topic || currentTopic,
        message: message || topic,
        examLevel: examLevel, // Use state instead of hardcoded value
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  }

  const loadQuestion = async () => {
    setIsLoading(true)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setShowLearnMore(false)

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
        })
      }
    } catch (error) {
      console.error("Error loading question:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const detectTrapWords = (questionText: string): TrapInfo[] => {
    const traps: TrapInfo[] = []
    const lowerText = questionText.toLowerCase()

    const trapPatterns: Array<{ word: string; type: "sequence" | "comparison" | "absolute"; explanation: string }> = [
      { word: "FIRST", type: "sequence", explanation: "Sequence matters - what comes BEFORE other steps?" },
      { word: "NEXT", type: "sequence", explanation: "Look for the step that comes AFTER what's been done" },
      { word: "BEST", type: "comparison", explanation: "Multiple options work, one is MORE appropriate" },
      { word: "MOST", type: "comparison", explanation: "Several are correct, pick the STRONGEST choice" },
      { word: "PRIMARY", type: "comparison", explanation: "Main reason, not secondary effects" },
      { word: "ALWAYS", type: "absolute", explanation: "Absolutes are usually WRONG in ABA" },
      { word: "NEVER", type: "absolute", explanation: "Absolutes are usually WRONG in ABA" },
      { word: "ONLY", type: "absolute", explanation: "Watch out - rarely is there ONLY one way" },
    ]

    trapPatterns.forEach(({ word, type, explanation }) => {
      if (lowerText.includes(word.toLowerCase())) {
        traps.push({ word, type, explanation })
      }
    })

    return traps
  }

  const generateQuickTip = (correctOption: QuizOption | undefined): string => {
    if (!correctOption) return ""
    const text = correctOption.text.toLowerCase()

    // Generate simple memory tricks based on common ABA concepts
    if (text.includes("generality")) return "Generality = behavior transfers across time, settings, and people"
    if (text.includes("effectiveness")) return "Effectiveness = Does it actually WORK to change behavior?"
    if (text.includes("applied")) return "Applied = Is it socially significant to the client?"
    if (text.includes("technological")) return "Technological = Can another person replicate it exactly?"
    if (text.includes("extinction")) return "Extinction = Stop the reinforcement, behavior decreases"
    if (text.includes("reinforcement")) return "Reinforcement = Behavior INCREASES after consequence"
    if (text.includes("punishment")) return "Punishment = Behavior DECREASES after consequence"

    return correctOption.rationale?.split(".")[0] || "Review this concept in your study materials"
  }

  const diagnoseError = (selectedOption: QuizOption | undefined, correctOption: QuizOption | undefined): string => {
    if (!selectedOption || !correctOption) return ""

    const selectedText = selectedOption.text.toLowerCase()
    const correctText = correctOption.text.toLowerCase()

    // Simple heuristics for error types
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

  const handleAnswer = (optionId: string) => {
    if (isAnswered) return

    setSelectedAnswer(optionId)
    setIsAnswered(true)
    setShowTrapAlert(false)
    setShowQuickTip(false)
    setShowWhyWrong(false)
    setShowLearnMore(false)

    const selectedOption = currentQuestion?.options.find((o) => o.id === optionId)
    const correctOption = currentQuestion?.options.find((o) => o.isCorrect)
    const isCorrect = selectedOption?.isCorrect

    if (currentQuestion) {
      setDetectedTraps(detectTrapWords(currentQuestion.content))
      setQuickTip(generateQuickTip(correctOption))
      if (!isCorrect) {
        setErrorDiagnosis(diagnoseError(selectedOption, correctOption))
      }
    }

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

  const loadPracticeQuestion = async (topic?: string) => {
    setIsTyping(true)
    const defaultTopic = examLevel === "rbt" ? "RBT exam concepts" : "BCBA exam concepts"

    try {
      const data = await callChatAPI("practice", topic || defaultTopic)
      setIsTyping(false)

      if (data.type === "quiz" && data.question) {
        const normalizedOptions: QuizOption[] = (data.options || []).map((opt: any, index: number) => {
          const letters = ["A", "B", "C", "D"]
          return {
            id: opt.id || letters[index] || String(index),
            text: opt.text || opt.answer || opt.content || `Option ${letters[index]}`,
            isCorrect: opt.isCorrect === true || opt.correct === true,
            rationale: opt.rationale || opt.explanation || "",
          }
        })

        const questionMessage: ChatMessage = {
          id: Date.now(),
          sender: "ai",
          type: "quiz_question",
          content: data.question,
          options: normalizedOptions,
          difficulty: data.difficulty || "Medium",
          userSelectedOptionId: null,
          isAnswered: false,
          trapWords: data.trapWords || [],
          highlightWords: data.highlightWords || [],
        }
        setMessages((prev) => [...prev, questionMessage])
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("[v0] Error loading practice question:", error)
      setIsTyping(false)
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Sorry, I couldn't generate a question. Please try again.",
        followUpActions: {
          title: "Try again:",
          cards: [],
          buttons: [{ id: "practice", text: "Retry", primary: true }],
        },
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const generateFlashcards = async (topic?: string) => {
    const defaultTopic = examLevel === "rbt" ? "RBT concepts" : "BCBA concepts"
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: `Generate flashcards about: ${topic || currentTopic || defaultTopic}`,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const data = await callChatAPI("flashcards", topic || currentTopic || defaultTopic)
      setIsTyping(false)

      if (data.flashcards && data.flashcards.length > 0) {
        const flashcardsMessage: ChatMessage = {
          id: Date.now(),
          sender: "ai",
          type: "flashcards",
          content: "Here are your flashcards. Click to flip!",
          flashcards: data.flashcards,
          flippedCards: new Set(),
          followUpActions: {
            title: "What's next?",
            cards: [],
            buttons: [
              { id: "more_flashcards", text: "More flashcards" },
              { id: "practice", text: "Practice questions", primary: true },
            ],
          },
        }
        setMessages((prev) => [...prev, flashcardsMessage])
      } else {
        throw new Error("No flashcards generated")
      }
    } catch (error) {
      setIsTyping(false)
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Sorry, I couldn't generate flashcards. Let me try with a practice question instead.",
        followUpActions: {
          title: "Options:",
          cards: [],
          buttons: [{ id: "practice", text: "Practice question", primary: true }],
        },
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const generateStudyGuide = async (topic?: string) => {
    const defaultTopic = examLevel === "rbt" ? "RBT concepts" : "BCBA concepts"
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: `Create study guide for: ${topic || currentTopic || defaultTopic}`,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const data = await callChatAPI("studyguide", topic || currentTopic || defaultTopic)
      setIsTyping(false)

      const guideMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: data.content,
        followUpActions: {
          title: "Continue learning:",
          cards: [
            {
              id: "flashcards",
              title: "Flashcards",
              description: "Create flashcards on this topic",
              iconType: "flashcards_purple",
            },
            {
              id: "studyguide",
              title: "Study Guide",
              description: "Get a study guide on this topic",
              iconType: "guide_green",
            },
          ],
          buttons: [
            { id: "review", text: "Review Quiz" },
            { id: "practice", text: "Practice Questions", primary: true },
          ],
        },
      }
      setMessages((prev) => [...prev, guideMessage])
    } catch (error) {
      setIsTyping(false)
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Sorry, I couldn't generate the study guide. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const explainTopic = async (topic: string) => {
    setCurrentTopic(topic)
    setIsTyping(true)

    try {
      const data = await callChatAPI("explain", topic)
      setIsTyping(false)

      const explainMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: data.content,
        followUpActions: {
          title: "Continue learning:",
          cards: [
            {
              id: "flashcards",
              title: "Flashcards",
              description: "Create flashcards on this topic",
              iconType: "flashcards_purple",
            },
            {
              id: "studyguide",
              title: "Study Guide",
              description: "Get a study guide on this topic",
              iconType: "guide_green",
            },
          ],
          buttons: [
            { id: "review", text: "Review Quiz" },
            { id: "practice", text: "Practice Questions", primary: true },
          ],
        },
      }
      setMessages((prev) => [...prev, explainMessage])
    } catch (error) {
      setIsTyping(false)
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Sorry, I couldn't explain that topic. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleCardClick = async (cardId: string) => {
    if (cardId === "practice") {
      const userMessage: ChatMessage = {
        id: Date.now(),
        sender: "user",
        type: "text",
        content: "Start practice",
      }
      setMessages((prev) => [...prev, userMessage])
      await loadPracticeQuestion()
    } else if (cardId === "topic") {
      setWaitingForTopic(true)
      const promptMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content:
          "What topic would you like to learn about? Type any ABA concept (e.g., 'reinforcement schedules', 'extinction', 'stimulus control').",
      }
      setMessages((prev) => [...prev, promptMessage])
      inputRef.current?.focus()
    } else if (cardId === "flashcards") {
      await generateFlashcards()
    } else if (cardId === "studyguide") {
      await generateStudyGuide()
    }
  }

  const handleAnswerOption = (messageId: number, optionId: string) => {
    const currentMessage = messages.find((m) => m.id === messageId)
    const selectedOption = currentMessage?.options?.find((opt) => opt.id === optionId)
    const correctOption = currentMessage?.options?.find((opt) => opt.isCorrect)

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.type === "quiz_question") {
          return {
            ...msg,
            userSelectedOptionId: optionId,
            isAnswered: true,
          }
        }
        return msg
      }),
    )

    setTimeout(() => {
      let feedbackContent = ""

      if (selectedOption?.isCorrect) {
        feedbackContent = "Excellent! You got it right."
      } else {
        // Determine error type
        const errorTypes = ["VOCABULARY", "CONCEPT", "APPLICATION"]
        const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
        feedbackContent = `Good try. Let's learn from this.\n\nError Type: ${errorType}`
      }

      const followUpMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        type: "text",
        content: feedbackContent,
        followUpActions: {
          title: "Keep learning:",
          cards: [
            {
              id: "flashcards",
              title: "Flashcards",
              description: "Create flashcards to review this topic",
              iconType: "flashcards_purple",
            },
            {
              id: "studyguide",
              title: "Study Guide",
              description: "Generate a study guide on this topic",
              iconType: "guide_green",
            },
          ],
          buttons: [
            { id: "review", text: "Review Quiz" },
            { id: "more", text: "More Questions", primary: true },
          ],
        },
      }
      setMessages((prev) => [...prev, followUpMessage])
    }, 1000)
  }

  const handleFlipCard = (messageId: number, cardIndex: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.type === "flashcards") {
          const newFlipped = new Set(msg.flippedCards)
          if (newFlipped.has(cardIndex)) {
            newFlipped.delete(cardIndex)
          } else {
            newFlipped.add(cardIndex)
          }
          return { ...msg, flippedCards: newFlipped }
        }
        return msg
      }),
    )
  }

  const handleActionButton = async (buttonId: string) => {
    if (buttonId === "more" || buttonId === "practice") {
      const userMessage: ChatMessage = {
        id: Date.now(),
        sender: "user",
        type: "text",
        content: "More questions",
      }
      setMessages((prev) => [...prev, userMessage])
      await loadPracticeQuestion(currentTopic)
    } else if (buttonId === "flashcards" || buttonId === "more_flashcards") {
      await generateFlashcards()
    } else if (buttonId === "studyguide") {
      await generateStudyGuide()
    } else if (buttonId === "review") {
      await loadPracticeQuestion(currentTopic)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: inputText,
    }
    setMessages((prev) => [...prev, userMessage])
    const userInput = inputText
    setInputText("")

    if (waitingForTopic) {
      setWaitingForTopic(false)
      await explainTopic(userInput)
    } else {
      setIsTyping(true)
      try {
        const data = await callChatAPI("chat", undefined, userInput)
        setIsTyping(false)

        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          sender: "ai",
          type: "text",
          content: data.content,
          followUpActions: {
            title: "Options:",
            cards: [
              {
                id: "practice",
                title: "Practice Questions",
                description: "Practice with questions on this topic",
                iconType: "quiz_blue",
              },
            ],
            buttons: [{ id: "practice", text: "Practice", primary: true }],
          },
        }
        setMessages((prev) => [...prev, aiMessage])
        setCurrentTopic(userInput)
      } catch (error) {
        setIsTyping(false)
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          sender: "ai",
          type: "text",
          content: "Sorry, I had trouble processing that. Could you try again?",
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-900/50 text-green-400 border border-green-700"
      case "Medium":
        return "bg-yellow-900/50 text-yellow-400 border border-yellow-700"
      case "Hard":
        return "bg-red-900/50 text-red-400 border border-red-700"
      default:
        return "bg-slate-800 text-slate-400"
    }
  }

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case "flashcards_purple":
        return <Brain className="w-5 h-5 text-purple-400" />
      case "guide_green":
        return <BookOpen className="w-5 h-5 text-green-400" />
      case "quiz_blue":
        return <Sparkles className="w-5 h-5 text-blue-400" />
      case "more_orange":
        return <Zap className="w-5 h-5 text-orange-400" />
      default:
        return <BookOpen className="w-5 h-5 text-slate-400" />
    }
  }

  const getIconBgColor = (iconType: string) => {
    switch (iconType) {
      case "flashcards_purple":
        return "bg-purple-900/50"
      case "guide_green":
        return "bg-green-900/50"
      case "quiz_blue":
        return "bg-blue-900/50"
      case "more_orange":
        return "bg-orange-900/50"
      default:
        return "bg-slate-800"
    }
  }

  const progressPercent = (gameStats.correctToday / gameStats.dailyGoal) * 100

  const startSession = () => {
    setSessionStarted(true)
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

  // Question screen
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header with progress */}
      <header className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setSessionStarted(false)} className="p-2 -ml-2 hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-amber-500">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{gameStats.streak}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 relative">
              <Zap className="w-5 h-5" />
              <span className="font-bold">{gameStats.xp}</span>
              {/* XP Animation */}
              {showXPAnimation && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-400 font-bold animate-bounce">
                  +10
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: gameStats.dailyGoal }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i < gameStats.correctToday
                  ? "bg-green-500"
                  : i < gameStats.questionsAnswered
                    ? "bg-red-500"
                    : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Loading question...</p>
          </div>
        ) : currentQuestion ? (
          <>
            {/* Question */}
            <div className="flex-1">
              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                    currentQuestion.difficulty === "Easy"
                      ? "bg-green-900/50 text-green-400"
                      : currentQuestion.difficulty === "Hard"
                        ? "bg-red-900/50 text-red-400"
                        : "bg-yellow-900/50 text-yellow-400"
                  }`}
                >
                  {currentQuestion.difficulty}
                </span>
                <p className="text-white text-lg leading-relaxed">{currentQuestion.content}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.id
                  const isCorrect = option.isCorrect
                  const showResult = isAnswered

                  let bgColor = "bg-slate-800 hover:bg-slate-700 border-slate-700"
                  if (showResult) {
                    if (isCorrect) {
                      bgColor = "bg-green-900/50 border-green-500"
                    } else if (isSelected && !isCorrect) {
                      bgColor = "bg-red-900/50 border-red-500"
                    } else {
                      bgColor = "bg-slate-800/50 border-slate-700 opacity-50"
                    }
                  } else if (isSelected) {
                    bgColor = "bg-amber-900/50 border-amber-500"
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${bgColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            showResult && isCorrect
                              ? "bg-green-500 text-black"
                              : showResult && isSelected && !isCorrect
                                ? "bg-red-500 text-white"
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
                  )
                })}
              </div>

              {/* Feedback - SHORT */}
              {isAnswered && (
                <div className="mt-6 space-y-3">
                  {/* Quick feedback */}
                  <div
                    className={`p-4 rounded-2xl ${
                      currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? "bg-green-900/30 border border-green-800"
                        : "bg-red-900/30 border border-red-800"
                    }`}
                  >
                    <p className="text-white font-medium">
                      {currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect
                        ? "Great job!"
                        : "Not quite. The correct answer was " +
                          currentQuestion.options.find((o) => o.isCorrect)?.id +
                          "."}
                    </p>
                  </div>

                  {detectedTraps.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowTrapAlert(!showTrapAlert)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-900/30 transition"
                      >
                        <span className="flex items-center gap-2 text-yellow-400 font-medium text-sm">
                          <span>🚨</span> Trap Alert
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-yellow-500 transition ${showTrapAlert ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showTrapAlert && (
                        <div className="px-4 pb-3 text-sm text-yellow-300/90">
                          {detectedTraps.map((trap, i) => (
                            <p key={i}>
                              <span className="font-bold">{trap.word}</span> = {trap.explanation}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {quickTip && (
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowQuickTip(!showQuickTip)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-900/30 transition"
                      >
                        <span className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                          <span>🎯</span> Quick Tip
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-blue-500 transition ${showQuickTip ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showQuickTip && <div className="px-4 pb-3 text-sm text-blue-300/90">{quickTip}</div>}
                    </div>
                  )}

                  {!currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect && errorDiagnosis && (
                    <div className="bg-red-900/20 border border-red-700/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowWhyWrong(!showWhyWrong)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-900/30 transition"
                      >
                        <span className="flex items-center gap-2 text-red-400 font-medium text-sm">
                          <span>📊</span> Why Wrong?
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-red-500 transition ${showWhyWrong ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showWhyWrong && <div className="px-4 pb-3 text-sm text-red-300/90">{errorDiagnosis}</div>}
                    </div>
                  )}

                  {/* Learn more - collapsible */}
                  <button
                    onClick={() => setShowLearnMore(!showLearnMore)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
                  >
                    <ChevronDown className={`w-4 h-4 transition ${showLearnMore ? "rotate-180" : ""}`} />
                    {showLearnMore ? "Hide explanation" : "Full explanation"}
                  </button>

                  {showLearnMore && (
                    <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300">
                      {currentQuestion.options.find((o) => o.isCorrect)?.rationale || "This is the correct answer."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom button */}
            {isAnswered && (
              <div className="pt-4 mt-auto">
                <Button
                  onClick={loadQuestion}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-6 text-lg rounded-2xl"
                >
                  Continue
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400">No question loaded</p>
          </div>
        )}
      </div>
    </div>
  )
}
