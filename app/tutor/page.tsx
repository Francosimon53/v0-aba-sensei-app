"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  User,
  Send,
  Sparkles,
  BookOpen,
  Brain,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
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
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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

export default function AITutorChatPage() {
  const [examLevel, setExamLevel] = useState<"bcba" | "rbt">("bcba")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [waitingForTopic, setWaitingForTopic] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const categories = examLevel === "rbt" ? RBT_CATEGORIES : BCBA_CATEGORIES
    const levelName = examLevel.toUpperCase()

    setMessages([
      {
        id: 1,
        sender: "ai",
        type: "text",
        content: `Hi! I'm your ${levelName} AI tutor. What would you like to practice today?`,
        followUpActions: {
          title: "Choose an option:",
          cards: [
            {
              id: "practice",
              title: "Start Practice",
              description: `Practice with ${levelName} exam questions`,
              iconType: "quiz_blue",
            },
            {
              id: "topic",
              title: "Learn a Topic",
              description: "Ask me about any ABA concept",
              iconType: "guide_green",
            },
          ],
          buttons: [{ id: "practice", text: "Start now", primary: true }],
        },
      },
    ])
  }, [examLevel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

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
          cards: [],
          buttons: [
            { id: "flashcards", text: "Flashcards" },
            { id: "practice", text: "Practice questions", primary: true },
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

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
            <span className="text-xl">🥋</span>
          </div>
          <div>
            <h1 className="font-semibold text-white">{examLevel === "rbt" ? "RBT" : "BCBA"} Tutor AI</h1>
            <p className="text-xs text-slate-500">AI-Powered Exam Prep</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setExamLevel("rbt")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                examLevel === "rbt" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              RBT
            </button>
            <button
              onClick={() => setExamLevel("bcba")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                examLevel === "bcba" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              BCBA
            </button>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            {message.sender === "ai" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🥋</span>
                </div>
                <div className="flex-1">
                  {message.type === "text" ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>

                      {message.followUpActions && (
                        <div className="mt-4 space-y-3">
                          {message.followUpActions.cards.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {message.followUpActions.cards.map((card) => (
                                <button
                                  key={card.id}
                                  onClick={() => handleCardClick(card.id)}
                                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-3 text-left transition-all hover:scale-[1.02]"
                                >
                                  <div
                                    className={`w-8 h-8 rounded-lg ${getIconBgColor(card.iconType)} flex items-center justify-center mb-2`}
                                  >
                                    {getIconComponent(card.iconType)}
                                  </div>
                                  <p className="text-sm font-medium text-slate-200">{card.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{card.description}</p>
                                </button>
                              ))}
                            </div>
                          )}

                          {message.followUpActions.buttons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.followUpActions.buttons.map((btn) => (
                                <Button
                                  key={btn.id}
                                  onClick={() => handleActionButton(btn.id)}
                                  variant={btn.primary ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    btn.primary
                                      ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                                      : "border-slate-700 text-slate-300 hover:bg-slate-800"
                                  }
                                >
                                  {btn.text}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : message.type === "quiz_question" ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(message.difficulty || "Medium")}`}
                        >
                          {message.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 border border-amber-700">
                          {examLevel.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-slate-200 leading-relaxed mb-4">
                        <HighlightedQuestion text={message.content} highlightWords={message.highlightWords} />
                      </p>

                      <div className="space-y-2">
                        {message.options?.map((option) => {
                          const isSelected = message.userSelectedOptionId === option.id
                          const showResult = message.isAnswered
                          const isCorrect = option.isCorrect

                          let buttonClass = "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                          if (showResult) {
                            if (isCorrect) {
                              buttonClass = "bg-green-900/50 border-green-600 text-green-300"
                            } else if (isSelected && !isCorrect) {
                              buttonClass = "bg-red-900/50 border-red-600 text-red-300"
                            } else {
                              buttonClass = "bg-slate-800/50 border-slate-700 text-slate-500"
                            }
                          }

                          return (
                            <button
                              key={option.id}
                              onClick={() => !message.isAnswered && handleAnswerOption(message.id, option.id)}
                              disabled={message.isAnswered}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${buttonClass} ${!message.isAnswered ? "hover:scale-[1.01]" : ""}`}
                            >
                              <span className="font-semibold text-amber-400">{option.id}.</span> {option.text}
                              {showResult && isCorrect && <span className="ml-2 text-green-400">✓</span>}
                              {showResult && isSelected && !isCorrect && <span className="ml-2 text-red-400">✗</span>}
                            </button>
                          )
                        })}
                      </div>

                      {/* Feedback sections after answering */}
                      {message.isAnswered && (
                        <div className="mt-4 space-y-3">
                          {/* Rationale for selected answer */}
                          {message.options && (
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                              <p className="text-sm text-slate-300">
                                <span className="font-semibold text-amber-400">Explanation: </span>
                                {message.options.find((o) => o.isCorrect)?.rationale || "No rationale available."}
                              </p>
                            </div>
                          )}

                          {/* Trap Detector */}
                          {message.trapWords && message.trapWords.length > 0 && (
                            <CollapsibleSection
                              title="TRAP DETECTOR"
                              icon={<AlertTriangle className="w-4 h-4" />}
                              iconColor="text-yellow-400"
                              bgColor="bg-yellow-900/20"
                              defaultOpen={false}
                            >
                              <div className="space-y-2">
                                {message.trapWords.map((trap, idx) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-semibold text-yellow-300">"{trap.word}"</span>
                                    <span className="text-slate-400 ml-2">({trap.type})</span>
                                    {trap.explanation && <p className="text-slate-400 mt-1">{trap.explanation}</p>}
                                    {trap.commonMeaning && trap.abaMeaning && (
                                      <div className="mt-1 text-xs">
                                        <p className="text-slate-500">Common: {trap.commonMeaning}</p>
                                        <p className="text-amber-400">ABA: {trap.abaMeaning}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleSection>
                          )}
                        </div>
                      )}
                    </div>
                  ) : message.type === "flashcards" ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md p-4 shadow-sm">
                      <p className="text-slate-200 mb-4">{message.content}</p>

                      <div className="grid grid-cols-1 gap-3">
                        {message.flashcards?.map((card, index) => {
                          const isFlipped = message.flippedCards?.has(index)
                          return (
                            <button
                              key={index}
                              onClick={() => handleFlipCard(message.id, index)}
                              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-left transition-all min-h-[80px]"
                            >
                              <p className="text-sm text-slate-400 mb-1">
                                {isFlipped ? "Answer" : "Question"} {index + 1}
                              </p>
                              <p className="text-slate-200">{isFlipped ? card.back : card.front}</p>
                            </button>
                          )
                        })}
                      </div>

                      {message.followUpActions && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.followUpActions.buttons.map((btn) => (
                            <Button
                              key={btn.id}
                              onClick={() => handleActionButton(btn.id)}
                              variant={btn.primary ? "default" : "outline"}
                              size="sm"
                              className={
                                btn.primary
                                  ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
                              }
                            >
                              {btn.text}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {message.sender === "user" && (
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%]">
                <p>{message.content}</p>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <span className="text-sm">🥋</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="max-w-[600px] mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={waitingForTopic ? "Type a topic to learn about..." : "Ask me anything about ABA..."}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
