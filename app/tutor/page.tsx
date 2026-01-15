"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bot, User, Send, ImageIcon, Mic, Sparkles, BookOpen, Brain, Zap } from "lucide-react"

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
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
  type: "text" | "quiz_question"
  content: string
  options?: QuizOption[]
  userSelectedOptionId?: string | null
  isAnswered?: boolean
  difficulty?: "Easy" | "Medium" | "Hard"
  followUpActions?: FollowUpActions
}

export default function AITutorChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      type: "text",
      content:
        "¡Hola! Soy tu tutor BCBA con IA. Puedes preguntarme sobre cualquier tema de ABA o comenzar a practicar.",
      followUpActions: {
        title: "¿Qué te gustaría hacer?",
        cards: [
          {
            id: "practice",
            title: "Comenzar práctica",
            description: "Practica con preguntas de examen BCBA",
            iconType: "quiz_blue",
          },
          {
            id: "topic",
            title: "Aprender un tema",
            description: "Pregúntame sobre conceptos específicos de ABA",
            iconType: "guide_green",
          },
        ],
        buttons: [{ id: "start", text: "Comenzar ahora", primary: true }],
      },
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleCardClick = async (cardId: string) => {
    if (cardId === "practice" || cardId === "start") {
      await loadPracticeQuestion()
    }
  }

  const loadPracticeQuestion = async () => {
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: "Comenzar práctica",
    }
    setMessages((prev) => [...prev, userMessage])

    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      const response = await fetch("/api/generate-topic-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "BCBA exam concepts" }),
      })

      if (!response.ok) throw new Error("Failed to generate question")

      const data = await response.json()
      setIsTyping(false)

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
      setIsTyping(false)
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sender: "ai",
        type: "text",
        content: "Lo siento, hubo un error generando la pregunta. Por favor intenta de nuevo.",
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

    // Add follow-up actions after 1 second
    setTimeout(() => {
      const selectedOption = messages.find((m) => m.id === messageId)?.options?.find((opt) => opt.id === optionId)

      const followUpMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        type: "text",
        content: selectedOption?.isCorrect ? "¡Excelente! 🎉" : "Buen intento. Aprendamos de esto.",
        followUpActions: {
          title: "Sigue aprendiendo",
          cards: [
            {
              id: "flashcards",
              title: "Tarjetas didácticas",
              description: "Crea un conjunto completo de tarjetas para repasar",
              iconType: "flashcards_purple",
            },
            {
              id: "studyguide",
              title: "Guía de estudio",
              description: "Genera una guía de estudio sobre este tema",
              iconType: "guide_green",
            },
          ],
          buttons: [
            { id: "review", text: "Cuestionario de revisión" },
            { id: "more", text: "Más preguntas", primary: true },
          ],
        },
      }
      setMessages((prev) => [...prev, followUpMessage])
    }, 1000)
  }

  const handleActionButton = async (buttonId: string) => {
    if (buttonId === "more") {
      await loadPracticeQuestion()
    }
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      type: "text",
      content: inputText,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputText("")

    // Simulate AI response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        type: "text",
        content: `Entiendo que estás interesado en "${inputText}". ¿Te gustaría practicar con preguntas sobre este tema?`,
        followUpActions: {
          title: "Opciones",
          cards: [
            {
              id: "practice",
              title: "Practicar con preguntas",
              description: "Genera preguntas de práctica sobre este tema",
              iconType: "quiz_blue",
            },
          ],
          buttons: [{ id: "start", text: "Comenzar", primary: true }],
        },
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1500)
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

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case "flashcards_purple":
        return <Brain className="w-5 h-5 text-purple-600" />
      case "guide_green":
        return <BookOpen className="w-5 h-5 text-green-600" />
      case "quiz_blue":
        return <Sparkles className="w-5 h-5 text-blue-600" />
      case "more_orange":
        return <Zap className="w-5 h-5 text-orange-600" />
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />
    }
  }

  const getIconBgColor = (iconType: string) => {
    switch (iconType) {
      case "flashcards_purple":
        return "bg-purple-100"
      case "guide_green":
        return "bg-green-100"
      case "quiz_blue":
        return "bg-blue-100"
      case "more_orange":
        return "bg-orange-100"
      default:
        return "bg-gray-100"
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">BCBA Tutor AI</h1>
            <p className="text-xs text-gray-500">Powered by Claude</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            {message.sender === "ai" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  {message.type === "text" ? (
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <p className="text-gray-900 leading-relaxed">{message.content}</p>

                      {message.followUpActions && (
                        <div className="mt-4 space-y-3">
                          <h3 className="text-lg font-medium text-gray-900">{message.followUpActions.title}</h3>

                          {/* Cards grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {message.followUpActions.cards.map((card) => (
                              <button
                                key={card.id}
                                onClick={() => handleCardClick(card.id)}
                                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer text-left group"
                              >
                                <div className="flex gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-full ${getIconBgColor(card.iconType)} flex items-center justify-center flex-shrink-0`}
                                  >
                                    {getIconComponent(card.iconType)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {card.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-0.5">{card.description}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {message.followUpActions.buttons.map((button) => (
                              <Button
                                key={button.id}
                                onClick={() => handleActionButton(button.id)}
                                variant={button.primary ? "default" : "outline"}
                                className={`rounded-full text-sm ${
                                  button.primary
                                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {button.text}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Quiz question
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-5 shadow-sm space-y-4">
                      {message.difficulty && (
                        <div className="flex justify-end">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${getDifficultyColor(message.difficulty)}`}
                          >
                            {message.difficulty}
                          </span>
                        </div>
                      )}

                      <p className="text-gray-900 leading-relaxed">{message.content}</p>

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
                                  ? "bg-green-50 text-green-900 border-green-500"
                                  : showAsIncorrect
                                    ? "bg-red-50 text-red-900 border-red-500"
                                    : message.isAnswered
                                      ? "bg-gray-50 text-gray-400 border-gray-200"
                                      : "bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-400 cursor-pointer"
                              }`}
                            >
                              <span className="font-semibold">{option.id}.</span> {option.text}
                            </button>
                          )
                        })}
                      </div>

                      {message.isAnswered && message.options && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                          <p className="font-semibold text-gray-900 mb-2">Explicación:</p>
                          {message.options.map((option) => {
                            if (option.id === message.userSelectedOptionId || option.isCorrect) {
                              return (
                                <div key={option.id} className="mb-3 last:mb-0">
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

            {message.sender === "user" && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                  <p>{message.content}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 bg-gray-100 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Pregúntale al tutor BCBA..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
            />
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <Mic className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
