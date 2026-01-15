"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bot, User } from "lucide-react"

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
}

interface ChatMessage {
  id: number
  sender: "ai" | "user"
  type: "text" | "quiz_question"
  content: string
  options?: QuizOption[]
  rationale?: string
  userSelectedOptionId?: string | null
  isAnswered?: boolean
  difficulty?: "Easy" | "Medium" | "Hard"
}

export default function AITutorChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      type: "text",
      content: "¡Hola! Soy tu tutor BCBA. ¿Listo para practicar?",
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleStartPractice = async () => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: "Comenzar",
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI typing
    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsTyping(false)

    // Fetch question from API
    try {
      const response = await fetch("/api/generate-topic-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "BCBA exam concepts" }),
      })

      if (!response.ok) throw new Error("Failed to generate question")

      const data = await response.json()

      // Add question as AI message
      const questionMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "quiz_question",
        content: data.question,
        options: data.options,
        difficulty: data.difficulty,
        userSelectedOptionId: null,
        isAnswered: false,
      }

      setMessages((prev) => [...prev, questionMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Lo siento, hubo un error. Por favor intenta de nuevo.",
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleAnswerOption = (messageId: number, optionId: string) => {
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

    // Auto-show next button after 2 seconds
    setTimeout(() => {
      const nextButton: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "¿Listo para la siguiente pregunta?",
      }
      setMessages((prev) => [...prev, nextButton])
    }, 2000)
  }

  const handleNextQuestion = async () => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: "Siguiente pregunta",
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI typing
    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsTyping(false)

    // Fetch new question
    try {
      const response = await fetch("/api/generate-topic-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "BCBA exam concepts" }),
      })

      if (!response.ok) throw new Error("Failed to generate question")

      const data = await response.json()

      const questionMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "quiz_question",
        content: data.question,
        options: data.options,
        difficulty: data.difficulty,
        userSelectedOptionId: null,
        isAnswered: false,
      }

      setMessages((prev) => [...prev, questionMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Lo siento, hubo un error. Por favor intenta de nuevo.",
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700"
      case "Medium":
        return "bg-yellow-100 text-yellow-700"
      case "Hard":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">BCBA Tutor AI</h1>
            <p className="text-xs text-gray-500">Siempre listo para ayudar</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            {/* AI Messages - Left aligned with avatar */}
            {message.sender === "ai" && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  {message.type === "text" ? (
                    // Regular text message
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-gray-900">{message.content}</p>
                      {message.content.includes("¿Listo para practicar?") && (
                        <Button
                          onClick={handleStartPractice}
                          className="mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
                        >
                          Comenzar
                        </Button>
                      )}
                      {message.content.includes("¿Listo para la siguiente pregunta?") && (
                        <Button
                          onClick={handleNextQuestion}
                          className="mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
                        >
                          Siguiente Pregunta
                        </Button>
                      )}
                    </div>
                  ) : (
                    // Quiz question block
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-5 space-y-4">
                      {/* Difficulty badge */}
                      {message.difficulty && (
                        <div className="flex justify-end">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${getDifficultyColor(message.difficulty)}`}
                          >
                            {message.difficulty}
                          </span>
                        </div>
                      )}

                      {/* Question text */}
                      <p className="text-gray-900 font-medium leading-relaxed">{message.content}</p>

                      {/* Answer options */}
                      <div className="space-y-2">
                        {message.options?.map((option) => {
                          const isSelected = message.userSelectedOptionId === option.id
                          const isCorrect = option.isCorrect
                          const showAsCorrect = message.isAnswered && isCorrect
                          const showAsIncorrect = message.isAnswered && isSelected && !isCorrect

                          return (
                            <button
                              key={option.id}
                              onClick={() => !message.isAnswered && handleAnswerOption(message.id, option.id)}
                              disabled={message.isAnswered}
                              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                showAsCorrect
                                  ? "bg-green-500 text-white border-green-600"
                                  : showAsIncorrect
                                    ? "bg-red-500 text-white border-red-600"
                                    : message.isAnswered
                                      ? "bg-gray-50 text-gray-400 border-gray-200"
                                      : "bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-400 cursor-pointer"
                              }`}
                            >
                              <span className="font-semibold">{option.id}.</span> {option.text}
                            </button>
                          )
                        })}
                      </div>

                      {/* Rationale - Shows after answering */}
                      {message.isAnswered && message.options && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                          <p className="font-semibold text-gray-900 mb-2">Explicación:</p>
                          {message.options.map((option) => {
                            if (option.id === message.userSelectedOptionId || option.isCorrect) {
                              return (
                                <div key={option.id} className="mb-3">
                                  <p className="text-sm font-semibold text-gray-700">
                                    {option.id}: {option.isCorrect ? "✓ Correcta" : "✗ Incorrecta"}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">{option.rationale}</p>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Messages - Right aligned */}
            {message.sender === "user" && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                  <p>{message.content}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
