"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, Send, Sparkles, BookOpen, Brain, Zap, ArrowLeft } from "lucide-react"
import Link from "next/link"

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

      if (data.type === "quiz" && data.question && data.options) {
        const questionMessage: ChatMessage = {
          id: Date.now(),
          sender: "ai",
          type: "quiz_question",
          content: data.question,
          options: data.options,
          difficulty: data.difficulty || "Medium",
          userSelectedOptionId: null,
          isAnswered: false,
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
      console.error("[v0] Error generating flashcards:", error)
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
      console.error("[v0] Error generating study guide:", error)
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
      console.error("[v0] Error explaining topic:", error)
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
      const selectedOption = messages.find((m) => m.id === messageId)?.options?.find((opt) => opt.id === optionId)

      const followUpMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        type: "text",
        content: selectedOption?.isCorrect ? "Excellent! You got it right." : "Good try. Let's learn from this.",
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
      // General chat - use RAG to respond
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
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
            <span className="text-xl">🥋</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">ABA Sensei</h1>
            <p className="text-xs text-gray-500">AI Tutor with RAG</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
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
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{message.content}</p>

                      {message.followUpActions && (
                        <div className="mt-4 space-y-3">
                          <h3 className="text-sm font-medium text-gray-700">{message.followUpActions.title}</h3>

                          {message.followUpActions.cards.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {message.followUpActions.cards.map((card) => (
                                <button
                                  key={card.id}
                                  onClick={() => handleCardClick(card.id)}
                                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer text-left group"
                                >
                                  <div className="flex gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-full ${getIconBgColor(card.iconType)} flex items-center justify-center flex-shrink-0`}
                                    >
                                      {getIconComponent(card.iconType)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                                        {card.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-0.5">{card.description}</p>
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
                  ) : message.type === "flashcards" ? (
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-5 shadow-sm space-y-4">
                      <p className="text-gray-900">{message.content}</p>

                      <div className="grid grid-cols-1 gap-3">
                        {message.flashcards?.map((card, index) => (
                          <button
                            key={index}
                            onClick={() => handleFlipCard(message.id, index)}
                            className="w-full p-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all text-left min-h-[80px]"
                          >
                            {message.flippedCards?.has(index) ? (
                              <div>
                                <p className="text-xs text-purple-500 mb-1">Answer:</p>
                                <p className="text-gray-900">{card.back}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs text-purple-500 mb-1">Question:</p>
                                <p className="text-gray-900 font-medium">{card.front}</p>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {message.followUpActions && (
                        <div className="flex gap-2 flex-wrap pt-2">
                          {message.followUpActions.buttons.map((button) => (
                            <Button
                              key={button.id}
                              onClick={() => handleActionButton(button.id)}
                              variant={button.primary ? "default" : "outline"}
                              className={`rounded-full text-sm ${
                                button.primary
                                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {button.text}
                            </Button>
                          ))}
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
                                      : "bg-white hover:bg-gray-50 border-gray-300 hover:border-amber-400 cursor-pointer"
                              }`}
                            >
                              <span className="font-semibold">{option.id}.</span> {option.text}
                            </button>
                          )
                        })}
                      </div>

                      {message.isAnswered && message.options && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="font-semibold text-gray-900 mb-2">Explanation:</p>
                          {message.options.map((option) => {
                            if (option.id === message.userSelectedOptionId || option.isCorrect) {
                              return (
                                <div key={option.id} className="mb-3 last:mb-0">
                                  <p className="text-sm font-semibold text-gray-700">
                                    {option.id}: {option.isCorrect ? "✓ Correct" : "✗ Incorrect"}
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
                <div className="bg-amber-500 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                  <p>{message.content}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🥋</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-gray-100 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={waitingForTopic ? "Enter a topic (e.g., reinforcement)" : "Ask the tutor anything..."}
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 rounded-full transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
