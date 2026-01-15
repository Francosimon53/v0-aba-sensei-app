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
  Target,
  XCircle,
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      type: "text",
      content: "Hi! I'm your BCBA AI tutor. What would you like to practice today?",
      followUpActions: {
        title: "Choose an option:",
        cards: [
          {
            id: "practice",
            title: "Start Practice",
            description: "Practice with BCBA exam questions",
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
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [waitingForTopic, setWaitingForTopic] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ... existing code (useEffect, callChatAPI) ...

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
        examLevel: "bcba",
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  }

  const loadPracticeQuestion = async (topic?: string) => {
    setIsTyping(true)

    try {
      const data = await callChatAPI("practice", topic || "BCBA exam concepts")
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

  // ... existing code (generateFlashcards, generateStudyGuide, explainTopic, handleCardClick) ...

  const generateFlashcards = async (topic?: string) => {
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: `Generate flashcards about: ${topic || currentTopic || "BCBA concepts"}`,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const data = await callChatAPI("flashcards", topic || currentTopic || "BCBA concepts")
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
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: `Create study guide for: ${topic || currentTopic || "BCBA concepts"}`,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const data = await callChatAPI("studyguide", topic || currentTopic || "BCBA concepts")
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
            <h1 className="font-semibold text-white">ABA Sensei</h1>
            <p className="text-xs text-slate-500">AI Tutor with RAG</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-400" />
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
                          <h3 className="text-sm font-medium text-slate-400">{message.followUpActions.title}</h3>

                          {message.followUpActions.cards.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {message.followUpActions.cards.map((card) => (
                                <button
                                  key={card.id}
                                  onClick={() => handleCardClick(card.id)}
                                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-700 hover:border-amber-500/50 transition-all cursor-pointer text-left group"
                                >
                                  <div className="flex gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-full ${getIconBgColor(card.iconType)} flex items-center justify-center flex-shrink-0`}
                                    >
                                      {getIconComponent(card.iconType)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                                        {card.title}
                                      </h4>
                                      <p className="text-sm text-slate-500 mt-0.5">{card.description}</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {message.followUpActions.buttons.map((button) => (
                              <Button
                                key={button.id}
                                onClick={() => handleActionButton(button.id)}
                                variant={button.primary ? "default" : "outline"}
                                className={`rounded-full text-sm ${
                                  button.primary
                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                                }`}
                              >
                                {button.text}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : message.type === "quiz_question" ? (
                    <div className="space-y-4">
                      {/* Question Card */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md p-5 shadow-sm">
                        {message.difficulty && (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getDifficultyColor(message.difficulty)}`}
                          >
                            {message.difficulty}
                          </span>
                        )}
                        <p className="text-slate-200 leading-relaxed text-base">
                          <HighlightedQuestion text={message.content} highlightWords={message.highlightWords} />
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2">
                        {message.options?.map((option) => {
                          const isSelected = message.userSelectedOptionId === option.id
                          const isAnswered = message.isAnswered
                          const isCorrect = option.isCorrect

                          let buttonClass = "bg-slate-900 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800"
                          if (isAnswered) {
                            if (isCorrect) {
                              buttonClass = "bg-green-900/30 border-green-500 text-green-300"
                            } else if (isSelected && !isCorrect) {
                              buttonClass = "bg-red-900/30 border-red-500 text-red-300"
                            } else {
                              buttonClass = "bg-slate-900/50 border-slate-800 opacity-60"
                            }
                          }

                          return (
                            <button
                              key={option.id}
                              onClick={() => !isAnswered && handleAnswerOption(message.id, option.id)}
                              disabled={isAnswered}
                              className={`w-full text-left p-4 rounded-xl border transition-all ${buttonClass} ${
                                !isAnswered ? "cursor-pointer" : "cursor-default"
                              }`}
                            >
                              <div className="flex gap-3">
                                <span className="font-semibold text-amber-400">{option.id}.</span>
                                <span className="text-slate-200">{option.text}</span>
                              </div>
                              {isAnswered && (isSelected || isCorrect) && option.rationale && (
                                <p className="mt-2 text-sm text-slate-400 pl-6">{option.rationale}</p>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {message.isAnswered && message.trapWords && message.trapWords.length > 0 && (
                        <div className="space-y-3 mt-4">
                          {/* Trap Detector Section */}
                          <CollapsibleSection
                            title="TRAP DETECTOR"
                            icon={<AlertTriangle className="w-4 h-4" />}
                            iconColor="text-yellow-400"
                            bgColor="bg-yellow-900/20"
                            defaultOpen={true}
                          >
                            <div className="space-y-3">
                              {message.trapWords.map((trap, idx) => (
                                <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded text-sm font-semibold">
                                      {trap.word}
                                    </span>
                                    <span className="text-xs text-slate-500 uppercase">
                                      {trap.type.replace("_", " ")}
                                    </span>
                                  </div>
                                  {trap.type === "aba_terminology" ? (
                                    <div className="text-sm space-y-1">
                                      <p className="text-slate-400">
                                        <span className="text-red-400">Common meaning:</span> {trap.commonMeaning}
                                      </p>
                                      <p className="text-slate-400">
                                        <span className="text-green-400">ABA meaning:</span> {trap.abaMeaning}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-400">{trap.explanation}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleSection>

                          {/* Decision Filter Section */}
                          <CollapsibleSection
                            title="DECISION FILTER"
                            icon={<Target className="w-4 h-4" />}
                            iconColor="text-blue-400"
                            bgColor="bg-blue-900/20"
                            defaultOpen={false}
                          >
                            <div className="text-sm text-slate-300 space-y-2">
                              <p>Step-by-step reasoning:</p>
                              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                <li>Read the question carefully - identify what is being asked</li>
                                <li>Look for key words (highlighted in yellow above)</li>
                                <li>Eliminate options that use absolute terms incorrectly</li>
                                <li>Apply ABA terminology correctly (not common meanings)</li>
                                <li>Choose the BEST answer that aligns with ABA principles</li>
                              </ol>
                            </div>
                          </CollapsibleSection>

                          {/* Error Diagnosis Section (only if wrong) */}
                          {message.userSelectedOptionId &&
                            !message.options?.find((o) => o.id === message.userSelectedOptionId)?.isCorrect && (
                              <CollapsibleSection
                                title="ERROR DIAGNOSIS"
                                icon={<XCircle className="w-4 h-4" />}
                                iconColor="text-red-400"
                                bgColor="bg-red-900/20"
                                defaultOpen={false}
                              >
                                <div className="text-sm text-slate-300 space-y-2">
                                  <p>Understanding your error helps you learn faster:</p>
                                  <div className="grid grid-cols-1 gap-2 mt-2">
                                    <div className="bg-slate-800/50 rounded-lg p-2">
                                      <span className="text-purple-400 font-semibold">VOCABULARY:</span>
                                      <span className="text-slate-400 ml-2">Did you misunderstand an ABA term?</span>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-2">
                                      <span className="text-orange-400 font-semibold">CONCEPT:</span>
                                      <span className="text-slate-400 ml-2">Did you confuse similar ABA concepts?</span>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-2">
                                      <span className="text-cyan-400 font-semibold">APPLICATION:</span>
                                      <span className="text-slate-400 ml-2">
                                        Did you know the theory but couldn't apply it?
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleSection>
                            )}
                        </div>
                      )}
                    </div>
                  ) : message.type === "flashcards" ? (
                    <div className="space-y-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                        <p className="text-slate-200">{message.content}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {message.flashcards?.map((card, index) => {
                          const isFlipped = message.flippedCards?.has(index)
                          return (
                            <button
                              key={index}
                              onClick={() => handleFlipCard(message.id, index)}
                              className="min-h-[120px] bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-amber-500/50 transition-all cursor-pointer text-left"
                            >
                              <div className="text-xs text-slate-500 mb-2">{isFlipped ? "Answer" : "Question"}</div>
                              <p className={`${isFlipped ? "text-amber-300" : "text-slate-200"}`}>
                                {isFlipped ? card.back : card.front}
                              </p>
                            </button>
                          )
                        })}
                      </div>

                      {message.followUpActions && (
                        <div className="flex gap-2 flex-wrap">
                          {message.followUpActions.buttons.map((button) => (
                            <Button
                              key={button.id}
                              onClick={() => handleActionButton(button.id)}
                              variant={button.primary ? "default" : "outline"}
                              className={`rounded-full text-sm ${
                                button.primary
                                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              {button.text}
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
              <div className="max-w-[75%]">
                <div className="bg-blue-600 rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                  <p className="text-white">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <span className="text-sm">🥋</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
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
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-3">
        <div className="max-w-[600px] mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="What would you like to learn?"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="rounded-full w-10 h-10 p-0 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
