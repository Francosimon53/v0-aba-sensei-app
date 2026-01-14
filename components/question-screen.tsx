"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"
import type { ExamType, Mode, Language } from "@/app/page"
import { saveProgress } from "@/lib/supabase"

interface QuestionScreenProps {
  examType: ExamType
  category: string
  mode: Mode
  onBack: () => void
  language: Language
}

const translations = {
  English: {
    submit: "Submit Answer",
    next: "Next Question",
    correct: "Correct!",
    incorrect: "Incorrect",
    trapDetector: "TRAP DETECTOR",
    trapWord: "Trap Word:",
    whyTrap: "Why this is a trap:",
    mightConfuse: "Common confusion:",
    allOptions: "Analysis of all options:",
    loading: "Generating your question...",
    error: "Failed to generate question. Please try again.",
    retry: "Try Again",
    hint: "Quick Hint",
    hintText: "Think about the sequence of steps and what comes after modeling...",
  },
  Español: {
    submit: "Enviar respuesta",
    next: "Siguiente pregunta",
    correct: "¡Correcto!",
    incorrect: "Incorreto",
    trapDetector: "DETECTOR DE TRAMPAS",
    trapWord: "Palabra trampa:",
    whyTrap: "Por qué es una trampa:",
    mightConfuse: "Confusión común:",
    allOptions: "Análise de todas las opções:",
    loading: "Generando su pregunta...",
    error: "Falha ao gerar questão. Por favor, tente novamente.",
    retry: "Tentar novamente",
    hint: "Dica rápida",
    hintText: "Pense na sequência de etapas e o que vem após a modelagem...",
  },
  Português: {
    submit: "Enviar resposta",
    next: "Próxima questão",
    correct: "Correto!",
    incorrect: "Incorreto",
    trapDetector: "DETECTOR DE ARMADILHAS",
    trapWord: "Palavra armadilha:",
    whyTrap: "Por que é uma armadilha:",
    mightConfuse: "Confusão comum:",
    allOptions: "Análise de todas as opções:",
    loading: "Gerando sua questão...",
    error: "Falha ao gerar questão. Por favor, tente novamente.",
    retry: "Tentar novamente",
    hint: "Dica rápida",
    hintText: "Pense na sequência de etapas e ce que vem após a modelagem...",
  },
  Français: {
    submit: "Soumettre la réponse",
    next: "Question suivante",
    correct: "Correct!",
    incorrect: "Incorrect",
    trapDetector: "DÉTECTEUR DE PIÈGES",
    trapWord: "Mot piège:",
    whyTrap: "Pourquoi c'est un piège:",
    mightConfuse: "Confusion courante:",
    allOptions: "Analyse de toutes les options:",
    loading: "Génération de votre question...",
    error: "Échec de la génération de la question. Veuillez réessayer.",
    retry: "Réessayer",
    hint: "Indice rapide",
    hintText: "Pensez à la séquence d'étapes et ce qui vient après la modélisation...",
  },
}

interface QuestionData {
  question: string
  options: string[]
  correctIndex: number
  thinkHint: string // Added thinkHint to interface
  trapWord: string
  trapExplanations: {
    whyTrap: string
    confusion: string
  }
  optionExplanations: {
    A: string
    B: string
    C: string
    D: string
  }
}

export function QuestionScreen({ examType, category, mode, onBack, language }: QuestionScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionData, setQuestionData] = useState<QuestionData | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showAllOptions, setShowAllOptions] = useState(false)
  const t = translations[language]

  useEffect(() => {
    loadQuestion()
  }, [])

  const loadQuestion = async () => {
    setLoading(true)
    setError(null)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setShowHint(false)
    setShowAllOptions(false)

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examLevel: examType,
          category: category,
          language: language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate question")
      }

      const data = await response.json()
      setQuestionData(data)
    } catch (err) {
      console.error("Error loading question:", err)
      setError(err instanceof Error ? err.message : "Failed to load question")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (selectedAnswer !== null && questionData) {
      setShowFeedback(true)

      // Save progress to database
      try {
        await saveProgress({
          category_id: category, // Changed from "category" to "category_id"
          user_answer: selectedAnswer,
          correct_answer: questionData.correctIndex,
          is_correct: selectedAnswer === questionData.correctIndex,
          exam_type: examType,
        })
      } catch (err) {
        console.error("Error saving progress:", err)
      }
    }
  }

  const handleNext = () => {
    loadQuestion()
  }

  const highlightTrapWords = (text: string) => {
    const trapWords = ["FIRST", "NEXT", "BEST", "ALWAYS", "NEVER", "MOST", "LEAST", "IMMEDIATELY"]
    let highlightedText = text

    trapWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      highlightedText = highlightedText.replace(regex, `<span class="text-yellow-400 font-semibold">${word}</span>`)
    })

    return highlightedText
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-sm">
            <span className="text-yellow-400 font-semibold">{examType}</span>
            <span className="text-gray-600 mx-2">•</span>
            <span className="text-gray-400">{category}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin" />
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-yellow-400/10 blur-xl" />
            </div>
            <p className="text-lg text-gray-300 font-medium">{t.loading}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !questionData) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-sm">
            <span className="text-yellow-400 font-semibold">{examType}</span>
            <span className="text-gray-600 mx-2">•</span>
            <span className="text-gray-400">{category}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6">
            <XCircle className="h-16 w-16 text-red-400" />
            <p className="text-lg text-gray-200 text-center max-w-md">{error || t.error}</p>
            <Button
              onClick={loadQuestion}
              className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 h-12 rounded-xl transition-all duration-300"
            >
              {t.retry}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = selectedAnswer === questionData.correctIndex

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white transition-colors duration-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <div className="w-2 h-2 rounded-full bg-gray-600" />
        </div>

        <div className="text-xs font-medium">
          <span className="text-yellow-400">{examType}</span>
          <span className="text-gray-600 mx-1.5">•</span>
          <span className="text-gray-400">{category}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 pb-32 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question 1</span>
              <span className="text-2xl">🥋</span>
            </div>

            <div
              className="text-base leading-relaxed text-gray-100"
              dangerouslySetInnerHTML={{ __html: highlightTrapWords(questionData.question) }}
            />
          </div>

          <div className="space-y-3">
            {questionData.options.map((option, index) => {
              const letter = ["A", "B", "C", "D"][index]
              const isSelected = selectedAnswer === index
              const showCorrect = showFeedback && index === questionData.correctIndex
              const showIncorrect = showFeedback && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => !showFeedback && setSelectedAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full glass-card rounded-xl p-4 transition-all duration-300 ${
                    showCorrect
                      ? "border-green-400/50 bg-green-400/10"
                      : showIncorrect
                        ? "border-red-400/50 bg-red-400/10"
                        : isSelected
                          ? "border-yellow-400 gold-glow bg-yellow-400/5"
                          : "hover:border-white/20 hover:bg-white/5"
                  } ${!showFeedback ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 transition-all duration-300 ${
                        showCorrect
                          ? "bg-green-400 text-black"
                          : showIncorrect
                            ? "bg-red-400 text-black"
                            : isSelected
                              ? "bg-yellow-400 text-black"
                              : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {letter}
                    </div>
                    <p className="text-left text-sm leading-relaxed text-gray-200 pt-0.5">{option}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {showFeedback && mode === "tutor" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              {/* Correct/Incorrect indicator */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-green-400">{t.correct}</p>
                        <p className="text-sm text-gray-400">Great work!</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-400/20 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-red-400">{t.incorrect}</p>
                        <p className="text-sm text-gray-400">Let's learn from this</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 bg-yellow-400/5 border-yellow-400/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="space-y-3">
                    <p className="font-bold text-yellow-400 text-base">{t.trapDetector}</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-yellow-400">{t.trapWord}</span>{" "}
                        <span className="font-bold text-yellow-300">{questionData.trapWord}</span>
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="font-semibold text-gray-200">{t.whyTrap}</span>{" "}
                        {questionData.trapExplanations.whyTrap}
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="font-semibold text-gray-200">{t.mightConfuse}</span>{" "}
                        {questionData.trapExplanations.confusion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowAllOptions(!showAllOptions)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
                >
                  <span className="font-semibold text-gray-200">Analysis of all options</span>
                  <ChevronLeft
                    className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                      showAllOptions ? "-rotate-90" : "rotate-180"
                    }`}
                  />
                </button>

                {showAllOptions && (
                  <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
                    {["A", "B", "C", "D"].map((letter, idx) => (
                      <div
                        key={letter}
                        className={`p-4 rounded-xl ${
                          idx === questionData.correctIndex
                            ? "bg-green-400/10 border border-green-400/30"
                            : "bg-black/20"
                        }`}
                      >
                        <p className="text-sm leading-relaxed text-gray-200">
                          <span className="font-bold text-yellow-400 mr-2">{letter}:</span>
                          {questionData.optionExplanations[letter as "A" | "B" | "C" | "D"]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent backdrop-blur-xl border-t border-white/5 z-10">
        <div className="max-w-3xl mx-auto">
          {!showFeedback ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20"
            >
              {t.submit}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-yellow-400/20"
            >
              {t.next}
            </Button>
          )}
        </div>
      </div>

      {!showFeedback && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl shadow-yellow-400/30 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all duration-300 z-20"
          aria-label={t.hint}
        >
          <Lightbulb className="h-6 w-6 text-black" />
        </button>
      )}

      {showHint && !showFeedback && questionData && (
        <div className="fixed bottom-28 right-24 max-w-xs z-20 animate-in slide-in-from-right-8 duration-300">
          <div className="glass-card rounded-2xl p-4 shadow-2xl border-yellow-400/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-yellow-400 mb-1">{t.hint}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{questionData.thinkHint}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
